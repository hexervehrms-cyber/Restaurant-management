/**
 * Dashboard KPI Types and DTOs
 * Phase 8.1: Enterprise Dashboard KPI Backend Integration
 */

// ─── KPI Value Structure ───────────────────────────────
export interface KPIMetric {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'neutral'
}

// ─── Individual KPI Responses ───────────────────────────
export interface KPIRevenue extends KPIMetric {
  currency: 'INR'
}

export interface KPIOrders extends KPIMetric {
  count: number
}

export interface KPIAverageTicket extends KPIMetric {
  currency: 'INR'
}

export interface KPITableOccupancy {
  occupancy: number
  occupiedCount: number
  availableCount: number
  reservedCount: number
  cleaningCount: number
  totalCount: number
  occupancyPercent: number
  previousOccupancyPercent: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface KPINewGuests extends KPIMetric {
  count: number
}

export interface KPISatisfaction {
  rating: number
  previousRating: number
  ratingCount: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  scale: 5
}

// ─── Aggregated Dashboard KPI Response ────────────────
export interface DashboardKPIResponse {
  revenue: KPIRevenue
  orders: KPIOrders
  averageTicket: KPIAverageTicket
  occupancy: KPITableOccupancy
  guests: KPINewGuests
  satisfaction: KPISatisfaction
  lastUpdated: string
  timestamp: number
}

// ─── Legacy Dashboard Summary (for compatibility) ──────
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

export interface SidebarCounts {
  reservations: number
  liveOrders: number
  inventoryAlerts: number
  posLive: boolean
  kitchenLive: boolean
}

export type OperationalStatus = 'OPEN' | 'CLOSED' | 'RUSH_HOUR'

export interface RestaurantStatus {
  isOpen: boolean
  statusLabel: string
  closingTime: string | null
  timezone: string
}

export interface RestaurantOperationalStatus {
  operationalStatus: OperationalStatus
  isOpen: boolean
  openingTime: string | null
  closingTime: string | null
  currentTime: string
  timezone: string
  hasManualOverride: boolean
  overrideExpiresAt?: string | null
}

export interface DashboardHeader {
  userName: string
  userGreeting: string
  restaurantName: string
  branchName: string
  isOpen: boolean
  closingTime: string | null
  currentTime: string
  timezone: string
}

export interface TopDish {
  id: string
  name: string
  orders: number
  revenue: number
  trend: string
  isVeg: boolean
}

export interface InventoryAlert {
  id: string
  item: string
  current: number
  unit: string
  status: 'critical' | 'low'
}
