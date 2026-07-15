'use client'

/**
 * Diagnostic version of DashboardOverview
 * This component helps identify why KPI cards are not rendering
 * 
 * If you see this rendered instead of cards, it means the component is being mounted.
 * Check the console for detailed logs.
 */

import { useDashboardKPIs } from '@/hooks/useDashboardKPIs'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export function DashboardOverviewDiagnostic() {
  const { data: kpis, loading, error, refresh } = useDashboardKPIs({
    branchId: '829b1e49-87b3-4cc9-a4a9-4e719bf4440c',
    enabled: true,
    pollInterval: 60000,
  })

  // Log everything
  console.log('[Diagnostic] Component mounted')
  console.log('[Diagnostic] State:', { loading, hasKPIs: !!kpis, hasError: !!error })
  console.log('[Diagnostic] KPI Data:', kpis)
  console.log('[Diagnostic] Error:', error?.message)

  // Render detailed diagnostic info
  return (
    <div className="space-y-6">
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="size-5 text-blue-600" />
              Dashboard Diagnostic Report
            </h3>

            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={loading ? 'text-red-600 font-bold' : 'text-green-600'}>{String(loading)}</span>
              </div>
              <div className="flex justify-between">
                <span>Has KPI Data:</span>
                <span className={kpis ? 'text-green-600' : 'text-red-600'}>{String(!!kpis)}</span>
              </div>
              <div className="flex justify-between">
                <span>Has Error:</span>
                <span className={error ? 'text-red-600' : 'text-green-600'}>{String(!!error)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 rounded text-sm">
                <p className="font-semibold text-red-700 dark:text-red-400">Error:</p>
                <p className="text-red-600 dark:text-red-300">{error.message}</p>
              </div>
            )}

            {kpis && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 rounded text-sm">
                <p className="font-semibold text-green-700 dark:text-green-400">✓ KPI Data Received:</p>
                <div className="space-y-1 text-xs font-mono text-green-600 dark:text-green-300 mt-2">
                  <p>• Revenue: ₹{kpis.revenue?.current?.toLocaleString('en-IN') ?? 'N/A'}</p>
                  <p>• Orders: {kpis.orders?.count ?? 'N/A'}</p>
                  <p>• Avg Ticket: ₹{kpis.averageTicket?.current?.toLocaleString('en-IN') ?? 'N/A'}</p>
                  <p>• Occupancy: {kpis.occupancy?.occupancyPercent ?? 'N/A'}%</p>
                  <p>• Guests: {kpis.guests?.count ?? 'N/A'}</p>
                  <p>• Satisfaction: {kpis.satisfaction?.rating ?? 'N/A'}/5</p>
                </div>
              </div>
            )}

            {loading && !kpis && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 rounded text-sm">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">⟳ Loading...</p>
                <p className="text-yellow-600 dark:text-yellow-300 text-xs mt-1">
                  Fetching KPI data from API. This should complete within 5 seconds.
                </p>
              </div>
            )}

            {!loading && !kpis && !error && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 rounded text-sm">
                <p className="font-semibold text-gray-700 dark:text-gray-400">No Data</p>
                <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                  Hook finished loading but no data returned. This is unusual.
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2">
              <p>Check browser console for detailed logs (search for '[Diagnostic]' or '[useDashboardKPIs]')</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
