'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, TableProperties, CalendarDays,
  ChefHat, ShoppingCart, BarChart3, Package, Users, Settings,
  CreditCard, Zap, ChevronDown, Building2, ChevronRight, PanelLeftClose,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'

/**
 * Sign Out Menu Item
 * Handles logout and redirect to login page
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
 * Premium Location Switcher Component
 * Displays current restaurant/branch with branded styling and hover effects
 */
function PremiumLocationSwitcher() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/15 p-3 space-y-2">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 w-fit">
        <div className="size-2 rounded-full bg-primary" />
        <span className="text-xs font-medium text-primary">Premium Account</span>
      </div>

      {/* Location Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-primary/60" />
          <span className="font-semibold text-sm text-foreground">Spice Garden</span>
        </div>
        <p className="text-xs text-muted-foreground pl-6">Mumbai Central Branch</p>
      </div>
    </div>
  )
}

/**
 * Premium Live Indicator Component
 * Shows active status with animated pulse
 */
function PremiumLiveIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20">
      <span className="size-2 rounded-full bg-success animate-pulse" />
      <span className="text-xs font-medium text-success/80">Live</span>
    </div>
  )
}

/**
 * Premium Counter Badge Component
 * Shows count with subtle styling
 */
function PremiumCountBadge({ count }: { count: string }) {
  return (
    <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-md text-xs font-semibold bg-muted text-foreground ring-1 ring-border/40">
      {count}
    </span>
  )
}

const navGroups = [
  {
    label: 'Operations',
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
]

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar, state: sidebarState } = useSidebar()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Operations: true,
    Kitchen: true,
    Business: true,
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
      className={cn(
        "border-r border-border/40 bg-background",
        "shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05)]"
      )}
    >
      {/* Premium Header Section */}
      <SidebarHeader className="border-b border-border/30 px-4 py-4 gap-3">
        {/* Premium Location Switcher */}
        <PremiumLocationSwitcher />

        {/* Collapse Button */}
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full h-9 rounded-lg gap-2",
              "hover:bg-muted/60 transition-all duration-200"
            )}
            onClick={toggleSidebar}
            title={sidebarState === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <PanelLeftClose className={cn(
              "size-4 transition-transform duration-300",
              sidebarState === 'collapsed' && "rotate-180"
            )} />
            <span className="text-xs font-medium">
              {sidebarState === 'expanded' ? 'Collapse' : 'Expand'}
            </span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Premium Navigation Content */}
      <SidebarContent className="gap-6 py-6 px-3">
        {navGroups.map((group) => {
          const isExpanded = expandedGroups[group.label] !== false
          const itemCount = group.items.length

          return (
            <div key={group.label} className="space-y-3">
              {/* Group Header with Toggle */}
              <div className="flex items-center justify-between px-3 group/header">
                <div className="space-y-0.5">
                  <h3 className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    "text-muted-foreground/70 transition-colors duration-200"
                  )}>
                    {group.label}
                  </h3>
                  <div className={cn(
                    "h-0.5 bg-gradient-to-r from-primary/40 to-transparent",
                    "transition-all duration-200",
                    !isExpanded && "opacity-0"
                  )} />
                </div>

                {/* Chevron Toggle */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "p-1 rounded-md transition-all duration-200",
                    "hover:bg-muted/60 opacity-0 group-hover/header:opacity-100"
                  )}
                  title={isExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <ChevronRight 
                    className={cn(
                      "size-4 text-muted-foreground/60 transition-transform duration-300",
                      isExpanded && "rotate-90"
                    )} 
                  />
                </button>
              </div>

              {/* Navigation Items */}
              {isExpanded && (
                <div className="space-y-1 pl-2">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                          "transition-all duration-200 group/item relative",
                          isActive
                            ? "bg-primary/12 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {/* Active Indicator - Left Bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-lg transition-all duration-200" />
                        )}

                        {/* Icon */}
                        <item.icon className={cn(
                          "size-5 shrink-0 transition-all duration-200",
                          isActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground"
                        )} />

                        {/* Label */}
                        <span className={cn(
                          "flex-1 text-sm font-medium transition-all duration-200",
                          isActive && "font-semibold"
                        )}>
                          {item.label}
                        </span>

                        {/* Badge */}
                        {item.badge && (
                          <div className="ml-auto">
                            {item.badge === 'Live' ? (
                              <PremiumLiveIndicator />
                            ) : (
                              <PremiumCountBadge count={item.badge} />
                            )}
                          </div>
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

      {/* Premium Footer Section */}
      <SidebarFooter className="border-t border-border/30 px-4 py-4 gap-3">
        {/* Settings Item */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg",
            "transition-all duration-200 group/settings relative",
            pathname === '/settings'
              ? "bg-primary/12 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          {pathname === '/settings' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-lg transition-all duration-200" />
          )}
          <Settings className={cn(
            "size-5 shrink-0 transition-all duration-200",
            pathname === '/settings' ? "text-primary" : "text-muted-foreground group-hover/settings:text-foreground"
          )} />
          <span className={cn(
            "flex-1 text-sm font-medium transition-all duration-200",
            pathname === '/settings' && "font-semibold"
          )}>
            Settings
          </span>
        </Link>

        {/* User Profile Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full",
              "transition-all duration-200 group/user",
              "hover:bg-muted/40"
            )}>
              <Avatar className={cn(
                "size-8 shrink-0 ring-2 ring-primary/20",
                "group-hover/user:ring-primary/40 transition-all duration-200"
              )}>
                <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
                  RS
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none min-w-0 text-left flex-1">
                <span className="text-sm font-medium text-foreground">Rajesh Sharma</span>
                <span className="text-xs text-muted-foreground">Owner</span>
              </div>
              <ChevronDown className="size-4 text-muted-foreground/50 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium text-foreground">Rajesh Sharma</p>
              <p className="text-xs text-muted-foreground">owner@spicegarden.com</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
