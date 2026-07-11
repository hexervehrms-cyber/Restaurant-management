'use client'

import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { tables } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const statusStyle = {
  available: 'border-success/40 bg-success/10 text-success hover:bg-success/20',
  occupied: 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25',
  reserved: 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20',
  cleaning: 'border-border bg-muted/50 text-muted-foreground',
  out_of_service: 'border-destructive/30 bg-destructive/5 text-destructive/60',
}

const statusLabel = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
  out_of_service: 'Out of Service',
}

export function TableOccupancyGrid() {
  const grouped = {
    indoor: tables.filter((t) => t.section === 'indoor'),
    outdoor: tables.filter((t) => t.section === 'outdoor'),
    vip: tables.filter((t) => t.section === 'vip'),
  }

  const counts = {
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    cleaning: tables.filter((t) => t.status === 'cleaning').length,
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold">Table Occupancy</CardTitle>
            <CardDescription className="text-xs">Live status across all sections</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link href="/tables">Manage Tables</Link>
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={cn(
                'size-2.5 rounded-sm border',
                status === 'available' && 'border-success/50 bg-success/15',
                status === 'occupied' && 'border-primary/50 bg-primary/20',
                status === 'reserved' && 'border-warning/50 bg-warning/15',
                status === 'cleaning' && 'border-border bg-muted',
              )} />
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
              <span className="text-xs font-semibold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          {(Object.entries(grouped) as [string, typeof tables][]).map(([section, sectionTables]) => (
            <div key={section}>
              <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">
                {section === 'vip' ? 'VIP Rooms' : `${section.charAt(0).toUpperCase() + section.slice(1)} Dining`}
              </p>
              <div className="flex flex-wrap gap-2">
                {sectionTables.map((table) => (
                  <Tooltip key={table.id}>
                    <TooltipTrigger
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl border p-2 transition-all cursor-pointer',
                        'min-w-[60px] h-14',
                        statusStyle[table.status]
                      )}
                    >
                      <span className="text-xs font-bold leading-none">{table.number}</span>
                      <div className="flex items-center gap-0.5 mt-1">
                        <Users className="size-2.5" />
                        <span className="text-[10px]">{table.capacity}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[160px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">Table {table.number}</span>
                        <span>{statusLabel[table.status]}</span>
                        {table.waiter && <span>Waiter: {table.waiter}</span>}
                        {table.occupiedSince && <span>Since: {table.occupiedSince}</span>}
                        {table.guestCount && <span>Guests: {table.guestCount}/{table.capacity}</span>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
