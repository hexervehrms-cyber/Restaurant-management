'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, TableProperties, CalendarDays,
  ChefHat, ShoppingCart, BarChart3, Package, Users, Settings,
  CreditCard, Zap, ChevronDown, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

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

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header — restaurant / branch switcher */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              {/*
               * Use render prop so DropdownMenuTrigger and SidebarMenuButton
               * merge into a SINGLE <button> element — no nested buttons.
               */}
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  />
                }
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary shrink-0">
                  <Building2 className="size-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none min-w-0">
                  <span className="font-semibold text-sm">Spice Garden</span>
                  <span className="text-xs text-muted-foreground">Mumbai Central</span>
                </div>
                <ChevronDown className="ml-auto size-4 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem>
                  <Building2 className="size-4" />
                  <span>Spice Garden — Mumbai</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Building2 className="size-4" />
                  <span>Spice Garden — Pune</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="text-muted-foreground">+ Add Location</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    {/* render prop merges SidebarMenuButton styles onto <Link> */}
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badge === 'Live' ? 'default' : 'secondary'}
                          className={cn(
                            'ml-auto h-5 min-w-5 px-1.5 text-xs font-medium',
                            item.badge === 'Live' && 'bg-success text-success-foreground'
                          )}
                        >
                          {item.badge === 'Live' ? (
                            <span className="flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-success-foreground animate-pulse" />
                              Live
                            </span>
                          ) : item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Settings: render as <Link> so it's an <a> not a nested button */}
            <SidebarMenuButton tooltip="Settings" render={<Link href="/settings" />}>
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              {/* Same render-prop merge pattern as header */}
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  />
                }
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    RO
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 leading-none min-w-0">
                  <span className="font-medium text-sm truncate">Rajesh Sharma</span>
                  <span className="text-xs text-muted-foreground truncate">Owner</span>
                </div>
                <ChevronDown className="ml-auto size-4 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="top">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
