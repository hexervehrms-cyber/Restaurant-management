'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, TableProperties, CalendarDays,
  ChefHat, ShoppingCart, BarChart3, Package, Users, Settings,
  CreditCard, Zap, ChevronDown, Building2, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'

/**
 * Sign Out Menu Item
 */
function SignOutMenuItem() {
  const router = useRouter()
  const { logout } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenuItem 
      onClick={handleSignOut}
      disabled={isLoading}
      className="text-destructive cursor-pointer"
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </DropdownMenuItem>
  )
}

/**
 * Minimal Live Indicator (Slack/Linear style)
 */
function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-success animate-pulse" />
      <span className="text-xs text-muted-foreground font-medium">Live</span>
    </div>
  )
}

/**
 * Counter Badge
 */
function CounterBadge({ count }: { count: string }) {
  return (
    <div className="inline-flex items-center justify-center size-5 rounded-full text-xs font-semibold bg-muted text-foreground">
      {count}
    </div>
  )
}

// Navigation groups
const navGroups = [
  {
    label: 'Restaurant',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'POS Terminal', href: '/pos', icon: ShoppingCart, badge: 'Live' },
      { label: 'Tables', href: '/tables', icon: TableProperties },
      { label: 'Reservations', href: '/reservations', icon: CalendarDays, badge: '3' },
      { label: 'Live Orders', href: '/orders', icon: Zap, badge: '5' },
    ],
  },
  {
    label: 'Kitchen',
    items: [
      { label: 'Kitchen Display', href: '/kitchen', icon: ChefHat, badge: 'Live' },
      { label: 'Menu Management', href: '/menu', icon: UtensilsCrossed },
      { label: 'Inventory', href: '/inventory', icon: Package, badge: '4' },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'CRM', href: '/crm', icon: Users },
      { label: 'Billing', href: '/billing', icon: CreditCard },
      { label: 'Staff', href: '/staff', icon: Users },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar, state: sidebarState } = useSidebar()
  const isCollapsed = sidebarState === 'collapsed'
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Restaurant: true,
    Kitchen: true,
    Business: true,
    Administration: true,
  })

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/40 bg-background"
    >
      {/* Workspace Header with Restaurant Card */}
      <SidebarHeader className={cn(
        "border-b border-border/30 px-4 py-3 gap-0",
        "transition-all duration-300"
      )}>
        {/* Restaurant Card */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg border border-border/30",
            "bg-gradient-to-br from-primary/8 via-primary/5 to-transparent",
            "hover:bg-muted/40 transition-all duration-200",
            "group text-left w-full"
          )}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {/* Restaurant Icon */}
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 transition-all duration-200">
            <Building2 className="size-4" />
          </div>

          {/* Restaurant Info (Hidden when collapsed) */}
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 space-y-0.5">
                <h2 className="font-semibold text-sm text-foreground truncate">Spice Garden</h2>
                <p className="text-xs text-muted-foreground truncate">Mumbai Central</p>
              </div>

              {/* Collapse Chevron */}
              <ChevronLeft className="size-4 text-muted-foreground/50 shrink-0 transition-transform duration-200 group-hover:text-muted-foreground" />
            </>
          )}

          {/* Collapsed State - Only Icon */}
          {isCollapsed && (
            <ChevronRight className="size-4 text-muted-foreground/50 absolute right-3 transition-transform duration-200" />
          )}
        </button>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className={cn(
        "gap-4 py-4 px-2",
        "transition-all duration-300"
      )}>
        {navGroups.map((group) => {
          const isExpanded = expandedGroups[group.label] !== false

          return (
            <div key={group.label} className="space-y-2">
              {/* Group Label (Hidden when collapsed) */}
              {!isCollapsed && (
                <div className="flex items-center justify-between px-3 h-7 group/label">
                  <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">
                    {group.label}
                  </p>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="opacity-0 group-hover/label:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted/40"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <ChevronRight 
                      className={cn(
                        "size-3.5 text-muted-foreground/60 transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )} 
                    />
                  </button>
                </div>
              )}

              {/* Navigation Items */}
              {isExpanded && (
                <div className={cn(
                  "space-y-1",
                  isCollapsed && "flex flex-col items-center"
                )}>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 h-9 rounded-lg text-sm",
                          "transition-all duration-200 group/nav relative",
                          isCollapsed && "justify-center px-2 w-9 h-9",
                          isActive
                            ? "bg-primary/12 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {/* Left accent bar for active (not shown when collapsed) */}
                        {isActive && !isCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r" />
                        )}

                        {/* Icon */}
                        <item.icon className={cn(
                          "size-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground"
                        )} />

                        {/* Label (Hidden when collapsed) */}
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 min-w-0 truncate">
                              {item.label}
                            </span>

                            {/* Status/Count Badge (Right-aligned) */}
                            {item.badge && (
                              <div className="ml-auto shrink-0">
                                {item.badge === 'Live' ? (
                                  <LiveIndicator />
                                ) : (
                                  <CounterBadge count={item.badge} />
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </SidebarContent>

      {/* User Profile Section */}
      <SidebarFooter className={cn(
        "border-t border-border/30 p-2",
        "transition-all duration-300"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 px-3 py-2.5 h-10 rounded-lg",
              "transition-all duration-200 group/user",
              "hover:bg-muted/40 w-full",
              isCollapsed && "justify-center px-2 w-10 h-10"
            )}>
              <Avatar className={cn(
                "shrink-0 ring-2 ring-border/40 transition-all duration-200",
                isCollapsed ? "size-6" : "size-8"
              )}>
                <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
                  RS
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col gap-0.5 min-w-0 text-left flex-1">
                    <span className="text-sm font-medium text-foreground truncate">Rajesh Sharma</span>
                    <span className="text-xs text-muted-foreground truncate">Owner</span>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground/50 shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            {/* User Header */}
            <div className="px-2 py-2 space-y-1">
              <p className="text-sm font-semibold text-foreground">Rajesh Sharma</p>
              <p className="text-xs text-muted-foreground">Owner</p>
            </div>

            <DropdownMenuSeparator />

            {/* Current Branch */}
            <div className="px-2 py-2 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Current Branch
              </p>
              <p className="text-sm text-foreground">Mumbai Central</p>
              <button className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-1">
                Change Branch →
              </button>
            </div>

            <DropdownMenuSeparator />

            {/* Account Options */}
            <DropdownMenuItem className="text-sm">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
