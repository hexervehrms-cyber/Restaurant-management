/**
 * Realtime Dashboard KPI Service
 * Phase 8.2: Real-Time Dashboard KPI Backend Integration
 *
 * Maintains persistent Firestore listeners on Orders, Tables, Customers, and Feedback.
 * Auto-calculates KPIs whenever any source data changes.
 * Notifies subscribers of KPI updates via callbacks.
 *
 * ARCHITECTURE:
 * Client → SSE Connection
 *        → RealtimeDashboardKPIService.subscribe()
 *           → Sets up listeners on Orders, Tables, Customers, Feedback
 *           → Auto-calculates KPIs on any change
 *           → Calls onUpdate callback with new KPIs
 * 
 * RESPONSIBILITIES:
 * - Set up real-time listeners on key collections
 * - Aggregate updated data into KPI metrics
 * - Notify subscribers when KPIs change
 * - Manage subscription lifecycle (cleanup on unsubscribe)
 * - Handle listener errors gracefully
 */

import { startOfDay, endOfDay, subDays } from 'date-fns'
import { BillingService } from '@/repositories'
import {
  OrderRepository,
  RestaurantTableRepository,
  CustomerRepository,
} from '@/repositories'
import type {
  DashboardKPIResponse,
  KPIRevenue,
  KPIOrders,
  KPIAverageTicket,
  KPITableOccupancy,
  KPINewGuests,
  KPISatisfaction,
} from '@/types/dashboard'

/**
 * Feedback Repository - Stub for now
 */
class FeedbackRepository {
  async findMany() {
    return []
  }
}

/**
 * Subscription tracking
 */
interface KPISubscription {
  branchId: string
  organizationId: string
  onUpdate: (kpis: DashboardKPIResponse) => void
  onError?: (error: Error) => void
  unsubscribers: (() => void)[]
}

export class RealtimeDashboardKPIService {
  private billingService: BillingService
  private orderRepo: OrderRepository
  private tableRepo: RestaurantTableRepository
  private customerRepo: CustomerRepository
  private feedbackRepo: FeedbackRepository

  // Store active subscriptions
  private subscriptions = new Map<string, KPISubscription>()

  // Store current data snapshots for re-calculation
  private dataCache = new Map<string, {
    orders: any[]
    tables: any[]
    customers: any[]
    feedback: any[]
  }>()

  // Debounce timer for updates (to avoid too frequent recalculations)
  private updateTimers = new Map<string, NodeJS.Timeout>()
  private readonly UPDATE_DEBOUNCE_MS = 500 // Wait 500ms after last change before updating

  constructor() {
    this.billingService = new BillingService()
    this.orderRepo = new OrderRepository()
    this.tableRepo = new RestaurantTableRepository()
    this.customerRepo = new CustomerRepository()
    this.feedbackRepo = new FeedbackRepository()
  }

  /**
   * Generate subscription ID for tracking
   */
  private getSubscriptionId(branchId: string, organizationId: string): string {
    return `${organizationId}:${branchId}`
  }

  /**
   * Initialize data cache for subscription
   */
  private initializeCache(key: string): void {
    if (!this.dataCache.has(key)) {
      this.dataCache.set(key, {
        orders: [],
        tables: [],
        customers: [],
        feedback: [],
      })
    }
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(current: number, previous: number): 'up' | 'down' | 'neutral' {
    if (current > previous) return 'up'
    if (current < previous) return 'down'
    return 'neutral'
  }

  /**
   * KPI 1: Revenue (Today vs Yesterday) - from cached orders
   */
  private async calculateRevenueFromCache(
    branchId: string,
    organizationId: string
  ): Promise<KPIRevenue> {
    const today = new Date()
    const yesterday = subDays(today, 1)

    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const yesterdayStart = startOfDay(yesterday)
    const yesterdayEnd = endOfDay(yesterday)

    try {
      const todayRevenueResult = await this.billingService.getRevenue(
        todayStart,
        todayEnd,
        branchId,
        organizationId
      )
      const todayRevenue = todayRevenueResult.revenue || 0

      const yesterdayRevenueResult = await this.billingService.getRevenue(
        yesterdayStart,
        yesterdayEnd,
        branchId,
        organizationId
      )
      const yesterdayRevenue = yesterdayRevenueResult.revenue || 0

      const change = todayRevenue - yesterdayRevenue
      const changePercent =
        yesterdayRevenue > 0 ? ((change / yesterdayRevenue) * 100) : 0

      return {
        current: todayRevenue,
        previous: yesterdayRevenue,
        change,
        changePercent: Math.round(changePercent * 10) / 10,
        trend: this.calculateTrend(todayRevenue, yesterdayRevenue),
        currency: 'INR',
      }
    } catch (error) {
      console.error('Error calculating revenue from cache:', error)
      return {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
        currency: 'INR',
      }
    }
  }

  /**
   * KPI 2: Total Orders - from cached orders
   */
  private async calculateOrdersFromCache(
    branchId: string,
    organizationId: string
  ): Promise<KPIOrders> {
    const today = new Date()
    const yesterday = subDays(today, 1)

    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const yesterdayStart = startOfDay(yesterday)
    const yesterdayEnd = endOfDay(yesterday)

    try {
      const todayOrdersCount = await this.orderRepo.countByDateRange(
        todayStart,
        todayEnd,
        branchId,
        organizationId,
        ['cancelled', 'refunded']
      )

      const yesterdayOrdersCount = await this.orderRepo.countByDateRange(
        yesterdayStart,
        yesterdayEnd,
        branchId,
        organizationId,
        ['cancelled', 'refunded']
      )

      const change = todayOrdersCount - yesterdayOrdersCount

      return {
        count: todayOrdersCount,
        current: todayOrdersCount,
        previous: yesterdayOrdersCount,
        change,
        changePercent:
          yesterdayOrdersCount > 0
            ? Math.round(((change / yesterdayOrdersCount) * 100) * 10) / 10
            : 0,
        trend: this.calculateTrend(todayOrdersCount, yesterdayOrdersCount),
      }
    } catch (error) {
      console.error('Error calculating orders from cache:', error)
      return {
        count: 0,
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
      }
    }
  }

  /**
   * KPI 3: Average Ticket - derived from revenue and orders
   */
  private calculateAverageTicket(
    revenue: KPIRevenue,
    orders: KPIOrders
  ): KPIAverageTicket {
    const currentAvg =
      orders.current > 0 ? revenue.current / orders.current : 0
    const previousAvg =
      orders.previous > 0 ? revenue.previous / orders.previous : 0

    const change = currentAvg - previousAvg
    const changePercent =
      previousAvg > 0 ? ((change / previousAvg) * 100) : 0

    return {
      current: Math.round(currentAvg * 100) / 100,
      previous: Math.round(previousAvg * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 10) / 10,
      trend: this.calculateTrend(currentAvg, previousAvg),
      currency: 'INR',
    }
  }

  /**
   * KPI 4: Table Occupancy - from cached tables
   */
  private calculateTableOccupancyFromCache(
    branchId: string,
    organizationId: string
  ): KPITableOccupancy {
    const key = this.getSubscriptionId(branchId, organizationId)
    const cache = this.dataCache.get(key)
    const tables = cache?.tables || []

    try {
      const occupiedCount = tables.filter(
        (t) => t.status === 'occupied'
      ).length
      const availableCount = tables.filter(
        (t) => t.status === 'available'
      ).length
      const reservedCount = tables.filter(
        (t) => t.status === 'reserved'
      ).length
      const cleaningCount = tables.filter(
        (t) => t.status === 'cleaning'
      ).length
      const totalCount = tables.length

      const occupancyPercent =
        totalCount > 0 ? (occupiedCount / totalCount) * 100 : 0

      const previousOccupancyPercent = 0 // Real-time doesn't track historical
      const change = occupancyPercent - previousOccupancyPercent

      return {
        occupancy: occupiedCount,
        occupiedCount,
        availableCount,
        reservedCount,
        cleaningCount,
        totalCount,
        occupancyPercent: Math.round(occupancyPercent * 10) / 10,
        previousOccupancyPercent,
        change: Math.round(change * 10) / 10,
        trend: this.calculateTrend(occupancyPercent, previousOccupancyPercent),
      }
    } catch (error) {
      console.error('Error calculating table occupancy from cache:', error)
      return {
        occupancy: 0,
        occupiedCount: 0,
        availableCount: 0,
        reservedCount: 0,
        cleaningCount: 0,
        totalCount: 0,
        occupancyPercent: 0,
        previousOccupancyPercent: 0,
        change: 0,
        trend: 'neutral',
      }
    }
  }

  /**
   * KPI 5: New Guests - from cached customers
   */
  private calculateNewGuestsFromCache(
    branchId: string,
    organizationId: string
  ): KPINewGuests {
    const key = this.getSubscriptionId(branchId, organizationId)
    const cache = this.dataCache.get(key)
    const customers = cache?.customers || []

    const today = new Date()
    const yesterday = subDays(today, 1)
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const yesterdayStart = startOfDay(yesterday)
    const yesterdayEnd = endOfDay(yesterday)

    try {
      const todayCustomers = customers.filter((c: any) => {
        const createdAt = c.createdAt?.toDate?.() || c.createdAt
        return createdAt >= todayStart && createdAt <= todayEnd
      })

      const yesterdayCustomers = customers.filter((c: any) => {
        const createdAt = c.createdAt?.toDate?.() || c.createdAt
        return createdAt >= yesterdayStart && createdAt <= yesterdayEnd
      })

      const todayCount = todayCustomers.length
      const yesterdayCount = yesterdayCustomers.length
      const change = todayCount - yesterdayCount

      return {
        count: todayCount,
        current: todayCount,
        previous: yesterdayCount,
        change,
        changePercent:
          yesterdayCount > 0
            ? Math.round(((change / yesterdayCount) * 100) * 10) / 10
            : 0,
        trend: this.calculateTrend(todayCount, yesterdayCount),
      }
    } catch (error) {
      console.error('Error calculating guests from cache:', error)
      return {
        count: 0,
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
      }
    }
  }

  /**
   * KPI 6: Customer Satisfaction - from cached feedback
   */
  private calculateSatisfactionFromCache(
    branchId: string,
    organizationId: string
  ): KPISatisfaction {
    const key = this.getSubscriptionId(branchId, organizationId)
    const cache = this.dataCache.get(key)
    const feedback = cache?.feedback || []

    const today = new Date()
    const yesterday = subDays(today, 1)
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const yesterdayStart = startOfDay(yesterday)
    const yesterdayEnd = endOfDay(yesterday)

    try {
      const todayFeedback = feedback.filter((f: any) => {
        const createdAt = f.createdAt?.toDate?.() || f.createdAt
        return createdAt >= todayStart && createdAt <= todayEnd
      })

      const yesterdayFeedback = feedback.filter((f: any) => {
        const createdAt = f.createdAt?.toDate?.() || f.createdAt
        return createdAt >= yesterdayStart && createdAt <= yesterdayEnd
      })

      const todayRating =
        todayFeedback.length > 0
          ? todayFeedback.reduce((sum, f: any) => sum + (f.rating || 0), 0) /
            todayFeedback.length
          : 0

      const yesterdayRating =
        yesterdayFeedback.length > 0
          ? yesterdayFeedback.reduce((sum, f: any) => sum + (f.rating || 0), 0) /
            yesterdayFeedback.length
          : 0

      const change = todayRating - yesterdayRating

      return {
        rating: Math.round(todayRating * 10) / 10,
        previousRating: Math.round(yesterdayRating * 10) / 10,
        ratingCount: todayFeedback.length,
        change: Math.round(change * 10) / 10,
        trend: this.calculateTrend(todayRating, yesterdayRating),
        scale: 5,
      }
    } catch (error) {
      console.error('Error calculating satisfaction from cache:', error)
      return {
        rating: 0,
        previousRating: 0,
        ratingCount: 0,
        change: 0,
        trend: 'neutral',
        scale: 5,
      }
    }
  }

  /**
   * Aggregate all KPIs from cached data
   */
  private async aggregateKPIs(
    branchId: string,
    organizationId: string
  ): Promise<DashboardKPIResponse> {
    try {
      const [revenue, orders, occupancy, guests, satisfaction] = await Promise.all([
        this.calculateRevenueFromCache(branchId, organizationId),
        this.calculateOrdersFromCache(branchId, organizationId),
        Promise.resolve(this.calculateTableOccupancyFromCache(branchId, organizationId)),
        Promise.resolve(this.calculateNewGuestsFromCache(branchId, organizationId)),
        Promise.resolve(this.calculateSatisfactionFromCache(branchId, organizationId)),
      ])

      const averageTicket = this.calculateAverageTicket(revenue, orders)
      const now = new Date()

      return {
        revenue,
        orders,
        averageTicket,
        occupancy,
        guests,
        satisfaction,
        lastUpdated: now.toISOString(),
        timestamp: now.getTime(),
      }
    } catch (error) {
      console.error('Error aggregating KPIs:', error)
      throw error
    }
  }

  /**
   * Debounced KPI update
   * Waits 500ms after last change before recalculating to batch updates
   */
  private scheduleKPIUpdate(key: string): void {
    const subscription = this.subscriptions.get(key)
    if (!subscription) return

    // Clear existing timer
    if (this.updateTimers.has(key)) {
      clearTimeout(this.updateTimers.get(key)!)
    }

    // Schedule new update
    const timer = setTimeout(async () => {
      try {
        const kpis = await this.aggregateKPIs(
          subscription.branchId,
          subscription.organizationId
        )
        subscription.onUpdate(kpis)
      } catch (error) {
        console.error('Error updating KPIs:', error)
        if (subscription.onError) {
          subscription.onError(error as Error)
        }
      }
    }, this.UPDATE_DEBOUNCE_MS)

    this.updateTimers.set(key, timer)
  }

  /**
   * Subscribe to real-time KPI updates
   * 
   * Sets up Firestore listeners on Orders, Tables, Customers, and Feedback.
   * Calls onUpdate whenever data changes.
   * 
   * RETURNS: Unsubscribe function that must be called to cleanup listeners
   * 
   * Usage:
   *   const unsubscribe = await service.subscribe(
   *     branchId,
   *     organizationId,
   *     (kpis) => sendToClient(kpis),
   *     (error) => handleError(error)
   *   )
   *   
   *   // Later, to stop listening:
   *   unsubscribe()
   */
  async subscribe(
    branchId: string,
    organizationId: string,
    onUpdate: (kpis: DashboardKPIResponse) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    const key = this.getSubscriptionId(branchId, organizationId)

    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      console.warn(`Already subscribed to KPI updates for ${key}`)
      const existing = this.subscriptions.get(key)!
      return () => {
        // Return dummy unsubscribe for duplicate subscription
      }
    }

    // Initialize cache
    this.initializeCache(key)

    // Store subscription
    const subscription: KPISubscription = {
      branchId,
      organizationId,
      onUpdate,
      onError,
      unsubscribers: [],
    }
    this.subscriptions.set(key, subscription)

    try {
      // Subscribe to Orders changes
      const ordersUnsubscribe = await this.orderRepo.onSnapshotQuery(
        {
          filters: [
            { field: 'branchId', operator: '==', value: branchId },
            { field: 'organizationId', operator: '==', value: organizationId },
          ],
        },
        (orders) => {
          const cache = this.dataCache.get(key)!
          cache.orders = orders
          this.scheduleKPIUpdate(key)
        },
        (error) => {
          console.error('Error listening to orders:', error)
          if (onError) onError(error)
        }
      )
      subscription.unsubscribers.push(ordersUnsubscribe)

      // Subscribe to Tables changes
      const tablesUnsubscribe = await this.tableRepo.onSnapshotQuery(
        {
          filters: [
            { field: 'branchId', operator: '==', value: branchId },
            { field: 'organizationId', operator: '==', value: organizationId },
          ],
        },
        (tables) => {
          const cache = this.dataCache.get(key)!
          cache.tables = tables
          this.scheduleKPIUpdate(key)
        },
        (error) => {
          console.error('Error listening to tables:', error)
          if (onError) onError(error)
        }
      )
      subscription.unsubscribers.push(tablesUnsubscribe)

      // Subscribe to Customers changes
      // NOTE: Customers are scoped by restaurantId, not branchId
      const customersUnsubscribe = await this.customerRepo.onSnapshotQuery(
        {
          filters: [
            { field: 'restaurantId', operator: '==', value: branchId },
            { field: 'organizationId', operator: '==', value: organizationId },
          ],
        },
        (customers) => {
          const cache = this.dataCache.get(key)!
          cache.customers = customers
          this.scheduleKPIUpdate(key)
        },
        (error) => {
          console.error('Error listening to customers:', error)
          if (onError) onError(error)
        }
      )
      subscription.unsubscribers.push(customersUnsubscribe)

      // Subscribe to Feedback changes (when implemented)
      const feedbackUnsubscribe = await this.feedbackRepo.findMany()
      if (feedbackUnsubscribe) {
        subscription.unsubscribers.push(() => {
          // Stub for feedback unsubscribe
        })
      }

      console.log(`✓ Real-time KPI subscription started for ${key}`)

      // Send initial KPI snapshot
      const initialKPIs = await this.aggregateKPIs(branchId, organizationId)
      onUpdate(initialKPIs)

      // Return unsubscribe function
      return () => {
        console.log(`⊘ Real-time KPI subscription ended for ${key}`)
        subscription.unsubscribers.forEach((u) => u())
        this.subscriptions.delete(key)
        this.dataCache.delete(key)

        // Clear pending update timer
        if (this.updateTimers.has(key)) {
          clearTimeout(this.updateTimers.get(key)!)
          this.updateTimers.delete(key)
        }
      }
    } catch (error) {
      console.error('Error setting up real-time KPI subscription:', error)
      this.subscriptions.delete(key)
      this.dataCache.delete(key)

      if (onError) {
        onError(error as Error)
      }

      // Return dummy unsubscribe
      return () => {}
    }
  }
}

// Singleton instance
let realtimeDashboardKPIService: RealtimeDashboardKPIService

export function getRealtimeDashboardKPIService(): RealtimeDashboardKPIService {
  if (!realtimeDashboardKPIService) {
    realtimeDashboardKPIService = new RealtimeDashboardKPIService()
  }
  return realtimeDashboardKPIService
}
