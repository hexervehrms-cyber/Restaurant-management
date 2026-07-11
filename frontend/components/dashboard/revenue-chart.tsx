'use client'

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { revenueData, weeklyRevenue } from '@/lib/mock-data'

type Range = 'today' | 'week'

const formatCurrency = (v: number) =>
  v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mt-0.5">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {entry.dataKey === 'orders' ? entry.value : `₹${entry.value.toLocaleString('en-IN')}`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart() {
  const [range, setRange] = useState<Range>('today')

  const data = range === 'today' ? revenueData : weeklyRevenue
  const xKey = range === 'today' ? 'time' : 'day'

  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
            <CardDescription className="text-xs">
              {range === 'today'
                ? 'Hourly revenue breakdown for today'
                : 'Daily revenue vs target this week'}
            </CardDescription>
          </div>
          <div className="flex rounded-lg border border-border p-0.5 gap-0.5">
            {(['today', 'week'] as Range[]).map((r) => (
              <Button
                key={r}
                variant={range === r ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs capitalize"
                onClick={() => setRange(r)}
              >
                {r === 'today' ? 'Today' : 'This Week'}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {range === 'today' && (
          <div className="flex items-center gap-6 pt-4 pb-2">
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">₹1,15,400</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-xl font-bold">777</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Peak Hour</p>
              <p className="text-xl font-bold">8 PM</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2 pr-2">
        <ResponsiveContainer width="100%" height={220}>
          {range === 'today' ? (
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, stroke: 'var(--chart-1)', strokeWidth: 2, fill: 'var(--background)' }}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => <span style={{ color: 'var(--muted-foreground)' }}>{v}</span>}
              />
              <Bar dataKey="revenue" name="Actual" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
