'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, TableProperties, CalendarDays,
  ChefHat, ShoppingCart, BarChart3, Package, Users, Settings,
  CreditCard, Zap, Building2, ChevronRight, ChevronLeft, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'

// Shared spacing constants
const SIDEBAR_SPACING = {
  contentPaddingX: 'px-1.5',
  contentPaddingY: 'py-2',
  itemPaddingX: 'px-2.5',
  itemPaddingY: 'py-2.5',
  itemHeight: 'h-9',
  iconSize: 'size-5',
  iconGap: 'gap-3',
  collapsedSize: 'size-9',
  collapsedPaddingX: 'px-2',
  sectionGapTop: 'mt-6',
  sectionGapBottom: 'mb-1',
  itemGap: 'gap-1.5',
}

/**
 * Counter Badge - Premium Circular Design
 */
function CounterBadge({ count }: { count: string }) {
  return (
    <div className="inline-flex items-center justify-center rounded-full text-xs font-medium bg-muted/50 text-muted-foreground/80 transition-all duration-200 hover:bg-muted/70" style={{ width: '20px', height: '20px' }}>
      {count}
    </div>
  )
}

/**
 * User Profile Footer Component
 * Premium account section with dropdown menu
 */
function UserProfileFooter() {
  const router = useRouter()
  const { logout, userProfile } = useAuth()
  const { state: sidebarState } = useSidebar()
  const isCollapsed = sidebarState === 'collapsed'

  const handleSignOut = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  // Get user initials from first and last name
  const getInitials = () => {
    if (!userProfile) return 'U'
    const firstName = userProfile.firstName?.charAt(0) || ''
    const lastName = userProfile.lastName?.charAt(0) || ''
    return (firstName + lastName).toUpperCase() || 'U'
  }

  // Get display name
  const getDisplayName = () => {
    if (!userProfile) return 'User'
    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`
    }
    return userProfile.firstName || userProfile.email?.split('@')[0] || 'User'
  }

  // Format role display (e.g., "restaurant_owner" → "Owner")
  const getFormattedRole = () => {
    if (!userProfile?.role) return 'User'
    const role = userProfile.role
    // Handle snake_case or kebab-case
    const formatted = role
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    return formatted
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-between gap-3",
            SIDEBAR_SPACING.itemHeight,
            SIDEBAR_SPACING.itemPaddingY,
            "px-3",
            "rounded-lg text-sm",
            "transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/40",
            "w-full",
            "group/profile"
          )}
          title="Account menu"
        >
          {/* Avatar - Increased size */}
          <div className={cn(
            "flex items-center justify-center flex-none",
            "rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary",
            "text-xs font-semibold",
            "transition-transform duration-200 group-hover/profile:scale-105"
          )} style={{ width: '36px', height: '36px' }}>
            {getInitials()}
          </div>

          {/* User Info - Hidden when collapsed */}
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground truncate leading-snug">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate leading-tight">
                  {getFormattedRole()}
                </p>
              </div>

              {/* Dropdown Chevron */}
              <ChevronDown className="size-4 text-muted-foreground/40 shrink-0 transition-all duration-200 group-hover/profile:text-muted-foreground group-hover/profile:translate-y-0.5" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
        {/* User Header in Dropdown */}
        <div className="px-4 py-3 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {getDisplayName()}
          </p>
          <p className="text-xs text-muted-foreground">
            {userProfile?.email || 'user@example.com'}
          </p>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem>
          Switch Branch
        </DropdownMenuItem>
        <DropdownMenuItem>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          Preferences
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Navigation groups
const navGroups = [
  {
    label: 'Restaurant',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'POS Terminal', href: '/pos', icon: ShoppingCart },
      { label: 'Tables', href: '/tables', icon: TableProperties },
      { label: 'Reservations', href: '/reservations', icon: CalendarDays, badge: '3' },
      { label: 'Live Orders', href: '/orders', icon: Zap, badge: '5' },
    ],
  },
  {
    label: 'Kitchen',
    items: [
      { label: 'Kitchen Display', href: '/kitchen', icon: ChefHat },
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
      className="border-r border-border/30 bg-background"
    >
      {/* ─── WORKSPACE HEADER (Premium Identity Card) ─── */}
      <SidebarHeader className="border-b border-border/20 px-2 py-4">
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center justify-between gap-3 px-3 py-3 rounded-lg",
            "hover:bg-muted/30 transition-all duration-220",
            "group text-left w-full",
            "border border-transparent hover:border-border/10",
            "hover:shadow-sm"
          )}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {/* Restaurant Icon - Increased to 48px */}
          <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 text-primary shrink-0 transition-all duration-220 group-hover:scale-110 group-hover:shadow-sm"
            style={{ width: '48px', height: '48px' }}>
            <Building2 className="size-5" />
          </div>

          {/* Restaurant Identity - Strong Typography */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base text-foreground truncate leading-snug">
                Spice Garden
              </h2>
              <p className="text-xs text-muted-foreground/60 truncate leading-tight mt-1">
                Mumbai Central
              </p>
            </div>
          )}

          {/* Collapse Button - Centered Vertically */}
          <div className={cn(
            "flex shrink-0 text-muted-foreground/40 transition-all duration-220",
            isCollapsed && "invisible"
          )}>
            <ChevronLeft className="size-4" />
          </div>
        </button>
      </SidebarHeader>

      {/* ─── NAVIGATION CONTENT (Premium Hierarchy) ─── */}
      <SidebarContent className={cn(SIDEBAR_SPACING.contentPaddingX, SIDEBAR_SPACING.contentPaddingY, "gap-1")}>
        <TooltipProvider delayDuration={300}>
          {navGroups.map((group, groupIdx) => {
            const isExpanded = expandedGroups[group.label] !== false

            return (
              <div 
                key={group.label}
                className={cn(
                  groupIdx > 0 && SIDEBAR_SPACING.sectionGapTop,
                  "space-y-1"
                )}
              >
                {/* ─── SECTION HEADER (Premium Typography) ─── */}
                {!isCollapsed && (
                  <div className={cn(
                    "flex items-center justify-between",
                    "px-3 py-2.5",
                    "group/label"
                  )}>
                    <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
                      {group.label}
                    </p>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        "opacity-0 group-hover/label:opacity-100",
                        "transition-opacity duration-200",
                        "p-1 rounded hover:bg-muted/40"
                      )}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <ChevronRight 
                        className={cn(
                          "size-3.5 text-muted-foreground/30 transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )} 
                      />
                    </button>
                  </div>
                )}

                {/* ─── NAVIGATION ITEMS (Perfect Alignment) ─── */}
                {isExpanded && (
                  <div className={cn(
                    isCollapsed && "flex flex-col items-center gap-1"
                  )}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      const hasCount = item.badge && item.badge !== 'Live'

                      const navItemContent = (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.label}
                          className={cn(
                            // Base layout
                            "flex items-center justify-start",
                            SIDEBAR_SPACING.itemHeight,
                            SIDEBAR_SPACING.itemPaddingY,
                            "px-3",
                            "rounded-lg text-sm",
                            // Animation
                            "transition-all duration-200",
                            "group/nav",
                            // Collapsed state - Fixed centering
                            isCollapsed && cn(
                              "justify-center",
                              SIDEBAR_SPACING.collapsedSize,
                              "px-0 py-0 mx-auto",
                              "relative"
                            ),
                            // Active state - Premium lightweight design
                            isActive
                              ? cn(
                                "bg-blue-500/8 text-primary font-semibold",
                                "border-l-3 border-primary pl-2",
                                isCollapsed && "border-l-0 pl-0 bg-primary/10"
                              )
                              : cn(
                                "text-muted-foreground hover:text-foreground",
                                "hover:bg-muted/40",
                                "border-l-3 border-transparent pl-2",
                                isCollapsed && "border-l-0 pl-0"
                              )
                          )}
                        >
                          {/* Icon - Perfect sizing and centering */}
                          <div className="flex items-center justify-center flex-none">
                            <item.icon className={cn(
                              SIDEBAR_SPACING.iconSize,
                              "transition-all duration-200",
                              isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground"
                            )} />
                          </div>

                          {/* Label - Hidden when collapsed */}
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 min-w-0 truncate ml-3">
                                {item.label}
                              </span>

                              {/* Badge - Right aligned */}
                              {hasCount && (
                                <div className="ml-2 shrink-0 flex items-center">
                                  <CounterBadge count={item.badge || ''} />
                                </div>
                              )}
                            </>
                          )}
                        </Link>
                      )

                      // Tooltip when collapsed
                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              {navItemContent}
                            </TooltipTrigger>
                            <TooltipContent 
                              side="right" 
                              className="bg-foreground/90 text-background text-xs font-medium px-2 py-1"
                            >
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return navItemContent
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </TooltipProvider>
      </SidebarContent>

      {/* ─── USER PROFILE FOOTER (Premium Account Section) ─── */}
      <SidebarFooter className="border-t border-border/20 px-2 py-3">
        <UserProfileFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
