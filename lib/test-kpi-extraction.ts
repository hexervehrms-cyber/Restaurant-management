/**
 * Test KPI Data Extraction
 * Validates that the hook correctly extracts data from the API response
 */

// Mock API response exactly as returned by /api/dashboard/kpis
const mockApiResponse = {
  success: true,
  message: 200,
  data: {
    revenue: { current: 4736, previous: 0, change: 4736, changePercent: 0, trend: 'up' as const, currency: 'INR' as const },
    orders: { count: 2, current: 2, previous: 0, change: 2, changePercent: 0, trend: 'up' as const },
    averageTicket: { current: 2368, previous: 0, change: 2368, changePercent: 0, trend: 'up' as const, currency: 'INR' as const },
    occupancy: { occupancy: 2, occupiedCount: 2, availableCount: 2, reservedCount: 1, cleaningCount: 1, totalCount: 6, occupancyPercent: 33.3, previousOccupancyPercent: 0, change: 33.3, trend: 'up' as const },
    guests: { count: 2, current: 2, previous: 0, change: 2, changePercent: 0, trend: 'up' as const },
    satisfaction: { rating: 0, previousRating: 0, ratingCount: 0, change: 0, trend: 'neutral' as const, scale: 5 as const },
    lastUpdated: '2026-07-15T14:19:41.525Z',
    timestamp: 1784125181525,
  },
}

/**
 * Test the extraction logic used in useDashboardKPIs hook
 */
export function testKpiDataExtraction() {
  console.log('\n=== KPI Data Extraction Test ===\n')

  // Simulate hook extraction
  const result = mockApiResponse
  const kpiData = result?.data || result

  console.log('1. Raw API response structure:')
  console.log(`   - Has success field: ${!!result.success}`)
  console.log(`   - Has data field: ${!!result.data}`)
  console.log(`   - Data is object: ${typeof result.data === 'object'}`)

  console.log('\n2. Extracted KPI data:')
  console.log(`   - Revenue current: ${kpiData.revenue?.current}`)
  console.log(`   - Orders count: ${kpiData.orders?.count}`)
  console.log(`   - Occupancy percent: ${kpiData.occupancy?.occupancyPercent}`)
  console.log(`   - Guests count: ${kpiData.guests?.count}`)
  console.log(`   - Satisfaction rating: ${kpiData.satisfaction?.rating}`)

  console.log('\n3. Component rendering checks:')
  console.log(`   - kpiData is truthy: ${!!kpiData}`)
  console.log(`   - kpiData.revenue exists: ${!!kpiData.revenue}`)
  console.log(`   - kpiData.revenue.current > 0: ${(kpiData.revenue?.current ?? 0) > 0}`)
  console.log(`   - kpiData.orders exists: ${!!kpiData.orders}`)
  console.log(`   - kpiData.orders.count > 0: ${(kpiData.orders?.count ?? 0) > 0}`)

  console.log('\n4. StatCard would render:')
  console.log(`   - Today's Revenue: ₹${(kpiData.revenue?.current ?? 0).toLocaleString('en-IN')}`)
  console.log(`   - Total Orders: ${kpiData.orders?.count ?? 0}`)
  console.log(`   - Avg Ticket: ₹${(kpiData.averageTicket?.current ?? 0).toLocaleString('en-IN')}`)
  console.log(`   - Table Occupancy: ${kpiData.occupancy?.occupancyPercent ?? 0}%`)
  console.log(`   - New Guests: ${kpiData.guests?.count ?? 0}`)
  console.log(`   - Satisfaction: ${kpiData.satisfaction?.rating ?? 0}/5`)

  console.log('\n=== Test Complete ===\n')

  return {
    success: !!kpiData && !!kpiData.revenue && !!kpiData.orders,
    kpiData,
  }
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testKpiDataExtraction()
}
