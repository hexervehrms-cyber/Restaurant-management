'use client'

import { useState, useEffect } from 'react'
import { Search, Moon, Sun, Command, Clock, ChevronDown, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/ui/command-palette'
import { NotificationCenter } from '@/components/ui/notification-center'
import { RestaurantStatusDropdown } from '@/components/dashboard/restaurant-status-dropdown'
import { useTheme } from '@/hooks/useTheme'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * Live Clock Component
 * Displays current time with live updates
 */
function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTime(new Date())
    setMounted(true)

    const id = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4" />
        <span className="font-mono">--:--</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="size-4" />
      <span className="font-mono">
        {time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

/**
 * Production-Quality Header Component
 * Single-row toolbar with proper layout and spacing
 */
interface TopNavbarProps {
  title?: string
  subtitle?: string
}

export function TopNavbar({ title, subtitle }: TopNavbarProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { commandOpen: storeCommandOpen, setCommandOpen: setStoreCommandOpen } = useUIStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (storeCommandOpen !== commandOpen) {
      setCommandOpen(storeCommandOpen)
    }
  }, [storeCommandOpen])

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="flex h-full items-center justify-between px-6 gap-4">
          {title && (
            <div className="flex items-center gap-4 min-w-0">
              <h1 className="font-semibold text-sm text-foreground truncate">{title}</h1>
            </div>
          )}
        </div>
      </header>
    )
  }

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      
      {/* Production Header - 64px height */}
      <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/95 backdrop-blur-sm transition-all duration-300">
        <div className="flex h-full items-center justify-between px-6 gap-4">
          
          {/* LEFT SECTION: Title + Time */}
          <div className="flex items-center gap-4 min-w-0">
            {title && (
              <>
                <h1 className="font-semibold text-sm text-foreground truncate">{title}</h1>
                <div className="hidden md:block w-px h-6 bg-border/40" />
                <div className="hidden md:flex">
                  <LiveClock />
                </div>
              </>
            )}
          </div>

          {/* CENTER SECTION: Search */}
          <div className="hidden md:flex flex-1 max-w-sm">
            <button
              onClick={() => setCommandOpen(true)}
              className={cn(
                "flex items-center gap-2 w-full px-3.5 py-2 rounded-lg",
                "bg-muted/40 border border-border/40",
                "text-muted-foreground text-sm",
                "hover:bg-muted/60 hover:border-border/60",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50"
              )}
              type="button"
            >
              <Search className="size-4 flex-shrink-0" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded border border-border/40 bg-background text-xs font-medium text-muted-foreground">
                <Command className="size-3" />K
              </kbd>
            </button>
          </div>

          {/* RIGHT SECTION: Store Status + Notifications + Theme + Profile */}
          <div className="flex items-center gap-1">
            
            {/* Store Status - hidden on small screens */}
            <div className="hidden lg:flex">
              <RestaurantStatusDropdown />
            </div>

            {/* Notifications */}
            <NotificationCenter limit={10} />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg hover:bg-muted/60 transition-colors duration-200"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}

