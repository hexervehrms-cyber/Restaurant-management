'use client'

import { useState, useEffect } from 'react'
import { Search, Moon, Sun, Command, Clock, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/ui/command-palette'
import { NotificationCenter } from '@/components/ui/notification-center'
import { RestaurantStatusDropdown } from '@/components/dashboard/restaurant-status-dropdown'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/context/AuthContext'
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
        <span className="w-10">--:--</span>
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
  branchId?: string
  restaurantId?: string
}

export function TopNavbar({ title, subtitle, branchId, restaurantId }: TopNavbarProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { commandOpen: storeCommandOpen, setCommandOpen: setStoreCommandOpen } = useUIStore()
  const { userProfile } = useAuth()

  // Use passed props or fallback to userProfile
  const effectiveBranchId = branchId || userProfile?.branchId
  const effectiveRestaurantId = restaurantId || userProfile?.restaurantId

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
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4">
        <div className="flex-1" />
      </header>
    )
  }

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 transition-all duration-300">
        {/* Left: Restaurant Identity */}
        <div className="flex items-center gap-2.5 min-w-0 group/identity">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 transition-all duration-200 group-hover/identity:bg-primary/15">
            <Building2 className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate">Spice Garden</span>
            <span className="text-xs text-muted-foreground/80 truncate">Mumbai Central Branch</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Center/Right: Clock, Search, Status */}
        <div className="flex items-center gap-3">
          {/* Clock */}
          <LiveClock />

          {/* Search */}
          <button
            className="hidden md:flex items-center gap-2 text-muted-foreground h-8 px-3 w-56 justify-start rounded-lg border border-border/60 bg-background/50 text-sm hover:bg-muted/70 hover:border-border/80 transition-all duration-200 ease-out"
            onClick={() => setCommandOpen(true)}
            type="button"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="text-xs flex-1 text-left truncate">Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/60 bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="size-2.5" />K
            </kbd>
          </button>

          {/* Restaurant Status - Single operational status */}
          {effectiveBranchId && effectiveRestaurantId && (
            <div className="hidden lg:flex">
              <RestaurantStatusDropdown 
                branchId={effectiveBranchId} 
                restaurantId={effectiveRestaurantId} 
              />
            </div>
          )}

          {/* Notifications */}
          <NotificationCenter limit={10} />

          {/* Theme toggle */}
          <style>{`
            @keyframes icon-rotate-to-dark {
              from {
                opacity: 1;
                transform: rotate(0deg);
              }
              to {
                opacity: 1;
                transform: rotate(180deg);
              }
            }
            @keyframes icon-rotate-to-light {
              from {
                opacity: 1;
                transform: rotate(0deg);
              }
              to {
                opacity: 1;
                transform: rotate(-180deg);
              }
            }
            @keyframes theme-fade-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .theme-icon-rotating {
              animation: icon-rotate-to-dark 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .theme-icon-rotating-reverse {
              animation: icon-rotate-to-light 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            @media (prefers-reduced-motion: reduce) {
              .theme-icon-rotating,
              .theme-icon-rotating-reverse {
                animation: none;
              }
            }
          `}</style>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 transition-all duration-300 hover:bg-muted/70 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun key="sun" className="size-4 theme-icon-rotating" />
            ) : (
              <Moon key="moon" className="size-4 theme-icon-rotating-reverse" />
            )}
          </Button>
        </div>
      </header>
    </>
  )
}

