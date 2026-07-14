'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, TableProperties, CalendarDays,
  ChefHat, ShoppingCart, BarChart3, Package, Users, Settings,
  CreditCard, Zap, ChevronDown, ChevronRight, PanelLeftClose,
  LogOut,
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
      className="gap-2 text-destructive cursor-pointer"
    >
      <LogOut className="size-3.5" strokeWidth={1.75} />
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </DropdownMenuItem>
  )
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-success/10 border border-success/30">
      <span className="relative inline-flex size-1.5 rounded-full bg-success animate-pulse" />
      <span className="text-xs font-semibold text-success">Live</span>
    </div>
  )
}

function CountBadge({ count }: { count: string }) {
  return (
    <Badge 
      variant="secondary" 
      className="text-xs font-semibold px-2 py-0.5 bg-muted/70 text-muted-foreground"
    >
      {count}
    </Badge>
  )
}

function GroupToggle({ 
  isExpanded, 
  onClick 
}: { 
  isExpanded: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-5 h-5 rounded transition-all duration-200 hover:bg-sidebar-accent/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
      title={isExpanded ? 'Collapse group' : 'Expand group'}
      aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
    >
      <ChevronRight 
        className={cn(
          "size-3.5 text-muted-foreground/60 transition-all duration-300 ease-out",
          isExpanded && "rotate-90"
        )}
        strokeWidth={1.75}
      />
    </button>
  )
}

function NavItem({
  item,
  isActive,
}: {
  item: { label: string; href: string; icon: any; badge?: string }
  isActive: boolean
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "relative group transition-all duration-200",
          "hover:bg-sidebar-accent/50 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
          isActive && "bg-primary/10 font-semibold shadow-sm"
        )}
      >
        <Link href={item.href} className="flex items-center gap-2.5">
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary/80 to-primary rounded-r-md transition-all duration-300" />
          )}

          <span
            className={cn(
              "flex items-center justify-center size-6 rounded-md shrink-0 transition-all duration-200",
              isActive ? "bg-primary/15" : "bg-transparent"
            )}
          >
            <Icon 
              className={cn(
                "size-4 transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-muted-foreground/80"
              )}
              strokeWidth={1.75}
            />
          </span>

          <span className={cn(
            "flex-1 text-sm truncate transition-all duration-200",
            isActive ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground/80"
          )}>
            {item.label}
          </span>

          {item.badge && (
            <div className="ml-auto shrink-0 transition-all duration-200">
              {item.badge === 'Live' ? <LiveBadge /> : <CountBadge count={item.badge} />}
            </div>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
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

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label],
    }))
  }, [])

  const renderedGroups = useMemo(() => {
    return navGroups.map((group) => {
      const isExpanded = expandedGroups[group.label] !== false

      return (
        <SidebarGroup key={group.label} className="gap-2.5">
          <div className="flex items-center justify-between px-4 gap-2">
            <SidebarGroupLabel className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.12em] px-0 transition-colors duration-200">
              {group.label}
            </SidebarGroupLabel>
            <GroupToggle 
              isExpanded={isExpanded} 
              onClick={() => toggleGroup(group.label)}
            />
          </div>

          <div className="h-px bg-gradient-to-r from-sidebar-border/50 to-sidebar-border/0 mx-4 transition-opacity duration-200" />

          {isExpanded && (
            <SidebarMenu className="gap-1.5 px-2 animate-in fade-in duration-200">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <NavItem 
                    key={item.href}
                    item={item}
                    isActive={isActive}
                  />
                )
              })}
            </SidebarMenu>
          )}
        </SidebarGroup>
      )
    })
  }, [pathname, expandedGroups, toggleGroup])

  return (
    <Sidebar 
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border/30 bg-sidebar/95 backdrop-blur-sm",
        "shadow-md transition-all duration-300"
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border/20 px-4 py-4 gap-0 bg-gradient-to-b from-sidebar/50 to-sidebar/0">
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger 
              className={cn(
                "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg",
                "bg-sidebar-accent/30 hover:bg-sidebar-accent/60 transition-all duration-200",
                "border border-sidebar-border/20 hover:border-sidebar-border/40",
                "cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
                "active:scale-95 shadow-sm hover:shadow-md"
              )}
              aria-label="Switch restaurant"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0 ring-1 ring-primary/30 group-hover:ring-primary/50 group-hover:bg-primary/20 transition-all duration-200">
                <span className="text-xs font-bold tracking-tight">SG</span>
              </div>
              <div className="flex flex-col gap-1 leading-none min-w-0 text-left">
                <span className="font-semibold text-sm text-foreground truncate">Spice Garden</span>
                <span className="text-xs text-muted-foreground/70 truncate">Mumbai Central</span>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground/60 transition-colors duration-200" strokeWidth={1.75} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem className="gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">SG</span>
                <span>Spice Garden — Mumbai</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">SG</span>
                <span>Spice Garden — Pune</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="text-muted-foreground">+ Add Location</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 rounded-lg",
              "hover:bg-sidebar-accent/60 active:scale-95",
              "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
            )}
            onClick={toggleSidebar}
            title={sidebarState === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={sidebarState === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <PanelLeftClose className="size-4 rotate-180 transition-transform duration-300" strokeWidth={1.75} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-4 py-5 px-0">
        {renderedGroups}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/20 px-2 py-3 gap-3 bg-gradient-to-t from-sidebar/50 to-sidebar/0">
        <SidebarMenu>
          <NavItem 
            item={{ label: 'Settings', href: '/settings', icon: Settings }}
            isActive={pathname === '/settings'}
          />
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger 
                className={cn(
                  "px-3 py-2.5 rounded-lg w-full flex items-center gap-2.5",
                  "hover:bg-sidebar-accent/50 transition-all duration-200",
                  "border border-sidebar-border/0 hover:border-sidebar-border/20",
                  "cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
                  "active:scale-[0.98] shadow-sm hover:shadow-md"
                )}
                aria-label="Open user menu"
              >
                <Avatar className="size-7 shrink-0 ring-2 ring-sidebar-border/30 group-hover:ring-primary/40 transition-all duration-200">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    RS
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 leading-none min-w-0 text-left">
                  <span className="font-semibold text-sm text-foreground truncate">Rajesh Sharma</span>
                  <span className="text-xs text-muted-foreground/70">Owner</span>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground/60 transition-colors duration-200" strokeWidth={1.75} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="top">
                <DropdownMenuItem className="gap-2 focus:bg-sidebar-accent/60">
                  <span className="flex-1">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 focus:bg-sidebar-accent/60">
                  <span className="flex-1">Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
