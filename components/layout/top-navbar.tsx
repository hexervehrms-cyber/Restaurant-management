'use client'

import { useState, useEffect } from 'react'
import { Search, Moon, Sun, Command, Wifi, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CommandPalette } from '@/components/ui/command-palette'
import { NotificationCenter } from '@/components/ui/notification-center'
import { RestaurantStatusDropdown } from '@/components/dashboard/restaurant-status-dropdown'
import { useTheme } from '@/hooks/useTheme'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Set initial time after hydration
    setTime(new Date())
    setMounted(true)

    // Update every minute
    const id = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  // Prevent hydration mismatch by not rendering until after hydration
  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
        <Clock className="size-3.5" />
        <span className="w-8">--:--</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
      <Clock className="size-3.5" />
      {time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </div>
  )
}

interface TopNavbarProps {
  title?: string
  subtitle?: string
}

export function TopNavbar({ title, subtitle }: TopNavbarProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { commandOpen: storeCommandOpen, setCommandOpen: setStoreCommandOpen } = useUIStore()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state between local state and store
  useEffect(() => {
    if (storeCommandOpen !== commandOpen) {
      setCommandOpen(storeCommandOpen)
    }
  }, [storeCommandOpen])

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4">
        <Separator orientation="vertical" className="h-5" />
        {title && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-semibold text-sm truncate">{title}</span>
            {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
          </div>
        )}
      </header>
    )
  }

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4">
        <Separator orientation="vertical" className="h-5" />

        {/* Title */}
        {title && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-semibold text-sm truncate">{title}</span>
            {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
          </div>
        )}

        <div className="flex-1" />

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <Wifi className="size-3" />
          Live
        </div>

        <LiveClock />

        {/* Search */}
        <button
          className="hidden md:flex items-center gap-2 text-muted-foreground h-8 px-3 w-48 justify-start rounded-lg border border-border bg-background text-sm hover:bg-muted transition-colors"
          onClick={() => setCommandOpen(true)}
          type="button"
        >
          <Search className="size-3.5" />
          <span className="text-xs flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
            <Command className="size-2.5" />K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationCenter limit={10} />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        {/* Restaurant Status - hidden on mobile */}
        <div className="hidden lg:flex">
          <RestaurantStatusDropdown />
        </div>
      </header>
    </>
  )
}

