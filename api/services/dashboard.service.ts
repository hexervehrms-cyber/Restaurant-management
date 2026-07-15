/**
 * Dashboard Service
 * Calculates dashboard metrics from Firestore repositories
 * 
 * ARCHITECTURE (Phase 6.2.14):
 * All metrics now use Firestore-backed repositories:
 * - Revenue: BillingService → BillRepository (Firestore)
 * - Orders: OrderRepository (Firestore)
 * - Tables: RestaurantTableRepository (Firestore)
 * - Customers: CustomerRepository (Firestore)
 * 
 * Pattern: DashboardService → Repositories → BaseRepository → Firestore
 */

import { startOfDay, endOfDay } from 'date-fns'
import { TenantContext } from '@/api/middleware/tenant'
import { BillingService } from '@/repositories'
import { CustomerRepository, OrderRepository, RestaurantTableRepository } from '@/repositories'

const billingService = new BillingService()
const customerRepo = new CustomerRepository()
const orderRepo = new OrderRepository()
const tableRepo = new RestaurantTableRepository()

export interface DashboardSummary {
  todayRevenue: number
  todayRevenueChangePercent: number
  totalOrders: number
  totalOrdersChange: number
  averageTicket: number
  averageTicketChangePercent: number
  tableOccupancyPercent: number
  tableOccupancyChangePercent: number
  newGuests: number
  newGuestsChange: number
  satisfactionRating: number | null
  satisfactionChange: number
}

export interface RevenueChartPoint {
  label: string
  revenue: number
  orders: number
}

export interface RevenueChartData {
  range: 'today' | 'week'
  totalRevenue: number
  totalOrders: number
  peakHour: string | null
  points: RevenueChartPoint[]
}

/**
 * Calculate today's dashboard summary
 */
export const getDashboardSummary = async (
  branchId: string,
  tenantContext: TenantContext
): Promise<DashboardSummary> => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Today's date range
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  // Yesterday's date range
  const yesterdayStart = startOfDay(yesterday)
  const yesterdayEnd = endOfDay(yesterday)

  try {
    // ─── Today's Revenue ───────────────────────────────────
    // Use BillingService to get revenue for today (Firestore)
    const todayRevenueResult = await billingService.getRevenue(
      todayStart,
      todayEnd,
      branchId,
      tenantContext.organizationId
    )
    const todayRevenueAmount = todayRevenueResult.revenue

    // Use BillingService to get revenue for yesterday (Firestore)
    const yesterdayRevenueResult = await billingService.getRevenue(
      yesterdayStart,
      yesterdayEnd,
      branchId,
      tenantContext.organizationId
    )
    const yesterdayRevenueAmount = yesterdayRevenueResult.revenue
    const todayRevenueChangePercent =
      yesterdayRevenueAmount > 0
        ? ((todayRevenueAmount - yesterdayRevenueAmount) /
            yesterdayRevenueAmount) *
          100
        : 0

    // ─── Today's Orders ───────────────────────────────────
    // Use OrderRepository (Firestore)
    const todayOrdersCount = await orderRepo.countByDateRange(
      todayStart,
      todayEnd,
      branchId,
      tenantContext.organizationId,
      ['cancelled', 'refunded']
    )

    const yesterdayOrdersCount = await orderRepo.countByDateRange(
      yesterdayStart,
      yesterdayEnd,
      branchId,
      tenantContext.organizationId,
      ['cancelled', 'refunded']
    )

    const totalOrdersChange = todayOrdersCount - yesterdayOrdersCount

    // ─── Average Ticket ────────────────────────────────────
    const averageTicket =
      todayOrdersCount > 0 ? todayRevenueAmount / todayOrdersCount : 0
    const yesterdayAvgTicket =
      yesterdayOrdersCount > 0 ? yesterdayRevenueAmount / yesterdayOrdersCount : 0
    const averageTicketChangePercent =
      yesterdayAvgTicket > 0
        ? ((averageTicket - yesterdayAvgTicket) / yesterdayAvgTicket) * 100
        : 0

    // ─── Table Occupancy ───────────────────────────────────
    // Use RestaurantTableRepository (Firestore)
    const occupiedTables = await tableRepo.countOccupied(
      branchId,
      tenantContext.organizationId
    )

    const totalActiveTables = await tableRepo.count({
      filters: [
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'organizationId', operator: '==', value: tenantContext.organizationId },
        { field: 'status', operator: '!=', value: 'maintenance' },
      ],
    })

    const tableOccupancyPercent =
      totalActiveTables > 0 ? (occupiedTables / totalActiveTables) * 100 : 0

    // TODO: Calculate table occupancy change from yesterday
    const tableOccupancyChangePercent = 0

    // ─── New Guests ────────────────────────────────────────
    // Use CustomerRepository (Firestore)
    const newGuestsCount = await customerRepo.countByDateRange(
      tenantContext.organizationId,
      todayStart,
      todayEnd
    )

    const yesterdayNewGuests = await customerRepo.countByDateRange(
      tenantContext.organizationId,
      yesterdayStart,
      yesterdayEnd
    )

    const newGuestsChange = newGuestsCount - yesterdayNewGuests

    // ─── Satisfaction Rating ───────────────────────────────
    // TODO: Implement satisfaction rating from customer_feedback table
    const satisfactionRating = null
    const satisfactionChange = 0

    return {
      todayRevenue: parseFloat(todayRevenueAmount.toFixed(2)),
      todayRevenueChangePercent: parseFloat(
        todayRevenueChangePercent.toFixed(1)
      ),
      totalOrders: todayOrdersCount,
      totalOrdersChange,
      averageTicket: parseFloat(averageTicket.toFixed(2)),
      averageTicketChangePercent: parseFloat(
        averageTicketChangePercent.toFixed(1)
      ),
      tableOccupancyPercent: parseFloat(tableOccupancyPercent.toFixed(1)),
      tableOccupancyChangePercent,
      newGuests: newGuestsCount,
      newGuestsChange,
      satisfactionRating,
      satisfactionChange,
    }
  } catch (error) {
    console.error('Error calculating dashboard summary:', error)
    throw error
  }
}

/**
 * Get revenue chart data for today (hourly)
 */
export const getRevenueChartToday = async (
  branchId: string,
  tenantContext: TenantContext
): Promise<RevenueChartData> => {
  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  try {
    // Use OrderRepository (Firestore)
    const orders = await orderRepo.getOrdersForChart(
      todayStart,
      todayEnd,
      branchId,
      tenantContext.organizationId,
      ['cancelled', 'refunded']
    )

    // Group by hour
    const hourlyData: Record<number, { revenue: number; orders: number }> = {}

    for (let hour = 6; hour <= 22; hour++) {
      hourlyData[hour] = { revenue: 0, orders: 0 }
    }

    orders.forEach((order) => {
      const hour = order.createdAt.getHours()
      if (hourlyData[hour]) {
        hourlyData[hour].revenue += parseFloat(order.totalAmount)
        hourlyData[hour].orders += 1
      }
    })

    const points: RevenueChartPoint[] = Object.entries(hourlyData).map(
      ([hour, data]) => ({
        label:
          hour === '6'
            ? '6am'
            : hour === '12'
              ? '12pm'
              : hour === '18'
                ? '6pm'
                : `${hour}${parseInt(hour) >= 12 ? 'pm' : 'am'}`,
        revenue: data.revenue,
        orders: data.orders,
      })
    )

    const totalRevenue = Object.values(hourlyData).reduce(
      (sum, data) => sum + data.revenue,
      0
    )
    const totalOrders = Object.values(hourlyData).reduce(
      (sum, data) => sum + data.orders,
      0
    )

    let peakHour: string | null = null
    let maxOrders = 0
    Object.entries(hourlyData).forEach(([hour, data]) => {
      if (data.orders > maxOrders) {
        maxOrders = data.orders
        peakHour = `${hour}:00`
      }
    })

    return {
      range: 'today',
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      peakHour,
      points,
    }
  } catch (error) {
    console.error('Error calculating revenue chart data:', error)
    throw error
  }
}

/**
 * Get revenue chart data for week (daily)
 */
export const getRevenueChartWeek = async (
  branchId: string,
  tenantContext: TenantContext
): Promise<RevenueChartData> => {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  try {
    // Use OrderRepository (Firestore)
    const orders = await orderRepo.getOrdersForChart(
      startOfDay(weekStart),
      endOfDay(today),
      branchId,
      tenantContext.organizationId,
      ['cancelled', 'refunded']
    )

    // Group by day
    const dailyData: Record<
      string,
      { revenue: number; orders: number }
    > = {}
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    days.forEach((day) => {
      dailyData[day] = { revenue: 0, orders: 0 }
    })

    orders.forEach((order) => {
      const day = days[order.createdAt.getDay()]
      dailyData[day].revenue += parseFloat(order.totalAmount)
      dailyData[day].orders += 1
    })

    const points: RevenueChartPoint[] = days.map((day) => ({
      label: day.substring(0, 3),
      revenue: dailyData[day].revenue,
      orders: dailyData[day].orders,
    }))

    const totalRevenue = Object.values(dailyData).reduce(
      (sum, data) => sum + data.revenue,
      0
    )
    const totalOrders = Object.values(dailyData).reduce(
      (sum, data) => sum + data.orders,
      0
    )

    return {
      range: 'week',
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      peakHour: null,
      points,
    }
  } catch (error) {
    console.error('Error calculating weekly revenue chart data:', error)
    throw error
  }
}


/**
 * Get dashboard header information
 * Includes: user name, greeting, restaurant/branch info, business status
 * 
 * FLOW: Repositories load user/restaurant/settings → Build response
 */
export const getDashboardHeader = async (
  userId: string,
  restaurantId: string,
  branchId: string,
  organizationId: string,
  userFirstName: string,
  userLastName: string,
  restaurantName: string,
  branchName: string,
  isOpen: boolean,
  closingTime: string | null,
  timezone: string
) => {
  // Calculate user greeting based on time of day
  const now = new Date()
  const hour = now.getHours()
  let userGreeting = 'Good morning'
  if (hour >= 12 && hour < 17) {
    userGreeting = 'Good afternoon'
  } else if (hour >= 17) {
    userGreeting = 'Good evening'
  }

  const userName = `${userFirstName} ${userLastName}`.trim() || 'User'

  // Format current time
  const currentTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return {
    userName,
    userGreeting,
    restaurantName,
    branchName,
    isOpen,
    closingTime,
    currentTime,
    timezone,
  }
}
