/**
 * Dashboard Service
 * Calculates dashboard metrics from database
 */

import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'
import { TenantContext } from '@/api/middleware/tenant'
import { BillingService } from '@/services/BillingService'

const prisma = new PrismaClient()
const billingService = new BillingService()

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
    // Use BillingService to get revenue for today
    const todayRevenueData = await billingService.getRevenue(
      todayStart,
      todayEnd,
      branchId,
      tenantContext.organizationId
    )
    const todayRevenueAmount = todayRevenueData

    // Use BillingService to get revenue for yesterday
    const yesterdayRevenueData = await billingService.getRevenue(
      yesterdayStart,
      yesterdayEnd,
      branchId,
      tenantContext.organizationId
    )
    const yesterdayRevenueAmount = yesterdayRevenueData
    const todayRevenueChangePercent =
      yesterdayRevenueAmount > 0
        ? ((todayRevenueAmount - yesterdayRevenueAmount) /
            yesterdayRevenueAmount) *
          100
        : 0

    // ─── Today's Orders ────────────────────────────────────
    const todayOrdersCount = await prisma.order.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          notIn: ['cancelled', 'refunded'],
        },
        deletedAt: null,
      },
    })

    const yesterdayOrdersCount = await prisma.order.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        status: {
          notIn: ['cancelled', 'refunded'],
        },
        deletedAt: null,
      },
    })

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
    const occupiedTables = await prisma.restaurantTable.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        status: {
          in: ['occupied', 'reserved'],
        },
        deletedAt: null,
      },
    })

    const totalActiveTables = await prisma.restaurantTable.count({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        status: {
          notIn: ['maintenance'],
        },
        deletedAt: null,
      },
    })

    const tableOccupancyPercent =
      totalActiveTables > 0 ? (occupiedTables / totalActiveTables) * 100 : 0

    // TODO: Calculate table occupancy change from yesterday
    const tableOccupancyChangePercent = 0

    // ─── New Guests ────────────────────────────────────────
    const newGuestsCount = await prisma.customer.count({
      where: {
        organizationId: tenantContext.organizationId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        deletedAt: null,
      },
    })

    const yesterdayNewGuests = await prisma.customer.count({
      where: {
        organizationId: tenantContext.organizationId,
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        deletedAt: null,
      },
    })

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
    const orders = await prisma.order.findMany({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          notIn: ['cancelled', 'refunded'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
      },
    })

    // Group by hour
    const hourlyData: Record<number, { revenue: number; orders: number }> = {}

    for (let hour = 6; hour <= 22; hour++) {
      hourlyData[hour] = { revenue: 0, orders: 0 }
    }

    orders.forEach((order) => {
      const hour = order.createdAt.getHours()
      if (hourlyData[hour]) {
        hourlyData[hour].revenue += Number(order.totalAmount)
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
    const orders = await prisma.order.findMany({
      where: {
        organizationId: tenantContext.organizationId,
        branchId: branchId,
        createdAt: {
          gte: startOfDay(weekStart),
          lte: endOfDay(today),
        },
        status: {
          notIn: ['cancelled', 'refunded'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
      },
    })

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
      dailyData[day].revenue += Number(order.totalAmount)
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
