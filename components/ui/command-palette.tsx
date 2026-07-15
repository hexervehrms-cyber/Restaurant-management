'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, TableProperties, CalendarDays,
  ChefHat, UtensilsCrossed, BarChart3, Package, Users, Zap,
  Receipt, User, Coffee, AlertCircle, Utensils, CreditCard, Settings,
} from 'lucide-react'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'

/**
 * Navigation pages - primary application sections
 */
const navigationPages = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'POS Terminal', href: '/pos', icon: ShoppingCart },
  { label: 'Tables', href: '/tables', icon: TableProperties },
  { label: 'Reservations', href: '/reservations', icon: CalendarDays },
  { label: 'Live Orders', href: '/orders', icon: Zap },
  { label: 'Kitchen Display', href: '/kitchen', icon: ChefHat },
  { label: 'Menu Management', href: '/menu', icon: UtensilsCrossed },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Staff', href: '/staff', icon: Users },
]

/**
 * Mock searchable data - ready for backend Firestore integration
 * 
 * Future integration points:
 * - Query Firestore collections: users, customers, orders, tables, reservations, menuItems, inventory, branches, restaurants
 * - Implement realtime search with debouncing
 * - Add pagination for large result sets
 * - Cache frequently accessed results
 */
const mockSearchData = {
  navigation: navigationPages,
  orders: [
    { id: 'ORD-001', label: 'Order ORD-001', subtitle: 'Table 5 — ₹2,450', href: '/orders' },
    { id: 'ORD-002', label: 'Order ORD-002', subtitle: 'Table 8 — ₹1,890', href: '/orders' },
    { id: 'ORD-003', label: 'Order ORD-003', subtitle: 'Delivery — ₹3,200', href: '/orders' },
  ],
  customers: [
    { id: 'CUST-001', label: 'Rajesh Kumar', subtitle: '5 bookings', href: '/crm' },
    { id: 'CUST-002', label: 'Priya Sharma', subtitle: '3 bookings', href: '/crm' },
    { id: 'CUST-003', label: 'Amit Patel', subtitle: 'VIP Member', href: '/crm' },
  ],
  tables: [
    { id: 'TABLE-01', label: 'Table 1', subtitle: 'Available', href: '/tables' },
    { id: 'TABLE-02', label: 'Table 2', subtitle: 'Occupied — 2 guests', href: '/tables' },
    { id: 'TABLE-03', label: 'Table 3', subtitle: 'Reserved — 7PM', href: '/tables' },
  ],
  reservations: [
    { id: 'RES-001', label: 'Reservation #201', subtitle: 'Today at 7:00 PM', href: '/reservations' },
    { id: 'RES-002', label: 'Reservation #202', subtitle: 'Tomorrow at 8:30 PM', href: '/reservations' },
  ],
  menu: [
    { id: 'MENU-001', label: 'Butter Chicken', subtitle: '₹450', href: '/menu' },
    { id: 'MENU-002', label: 'Garlic Naan', subtitle: '₹80', href: '/menu' },
    { id: 'MENU-003', label: 'Paneer Tikka', subtitle: '₹350', href: '/menu' },
  ],
  staff: [
    { id: 'STAFF-001', label: 'Vikram Singh', subtitle: 'Waiter', href: '/staff' },
    { id: 'STAFF-002', label: 'Deepak Verma', subtitle: 'Chef', href: '/staff' },
    { id: 'STAFF-003', label: 'Neha Gupta', subtitle: 'Manager', href: '/staff' },
  ],
  inventory: [
    { id: 'INV-001', label: 'Saffron', subtitle: '12g — Low stock', href: '/inventory' },
    { id: 'INV-002', label: 'Basmati Rice', subtitle: '50kg', href: '/inventory' },
    { id: 'INV-003', label: 'Paneer', subtitle: '5kg — Low stock', href: '/inventory' },
  ],
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault()
        onOpenChange(true)
      }
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onOpenChange])

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('')
    } else {
      // Focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  /**
   * Filter search results across all categories
   * Architecture ready for backend Firestore queries
   */
  const filteredResults = useMemo(() => {
    if (!search.trim()) {
      return null
    }

    const query = search.toLowerCase()
    const results: Record<string, Array<any>> = {}

    Object.entries(mockSearchData).forEach(([category, items]) => {
      const filtered = items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query))
      )
      if (filtered.length > 0) {
        results[category] = filtered
      }
    })

    return results
  }, [search])

  const navigate = (href: string) => {
    router.push(href)
    setSearch('')
    onOpenChange(false)
  }

  /**
   * Get category-specific icon for visual hierarchy
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return LayoutDashboard
      case 'orders':
        return Receipt
      case 'customers':
        return User
      case 'menu':
        return Coffee
      case 'staff':
        return Users
      case 'inventory':
        return AlertCircle
      case 'tables':
        return TableProperties
      case 'reservations':
        return CalendarDays
      default:
        return LayoutDashboard
    }
  }

  /**
   * Format category label for display
   */
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      navigation: 'Navigation',
      orders: 'Orders',
      customers: 'Customers',
      tables: 'Tables',
      reservations: 'Reservations',
      menu: 'Menu',
      staff: 'Staff',
      inventory: 'Inventory',
    }
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        ref={inputRef}
        autoFocus
        placeholder="Search across your restaurant..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {search.trim() ? (
          <>
            {!filteredResults || Object.keys(filteredResults).length === 0 ? (
              <CommandEmpty className="flex flex-col items-center gap-2 py-12">
                <AlertCircle className="size-6 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium">No matching results</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching customers, orders, tables, or menu items.
                  </p>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {Object.entries(filteredResults).map(([category, items]) => {
                  if (!items || items.length === 0) return null
                  return (
                    <div key={category}>
                      <CommandGroup heading={getCategoryLabel(category)}>
                        {items.map((item) => {
                          const Icon = getCategoryIcon(category)
                          return (
                            <CommandItem
                              key={item.id}
                              value={item.label}
                              onSelect={() => navigate(item.href)}
                              className="data-[selected=true]:bg-blue-500/10 data-[selected=true]:text-primary cursor-pointer"
                            >
                              <Icon className="size-4 mr-2 text-muted-foreground data-[selected=true]:text-primary" />
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-medium">{item.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.subtitle}
                                </span>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                      <CommandSeparator />
                    </div>
                  )
                })}
              </>
            )}
          </>
        ) : (
          <>
            <CommandEmpty className="flex flex-col items-center gap-2 py-8">
              <p className="text-sm text-muted-foreground">Start typing to search</p>
            </CommandEmpty>

            <CommandGroup heading="Navigation">
              {navigationPages.map((page) => (
                <CommandItem
                  key={page.href}
                  value={page.label}
                  onSelect={() => navigate(page.href)}
                  className="data-[selected=true]:bg-blue-500/10 data-[selected=true]:text-primary cursor-pointer"
                >
                  <page.icon className="size-4 mr-2 text-muted-foreground data-[selected=true]:text-primary" />
                  <span className="font-medium">{page.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
