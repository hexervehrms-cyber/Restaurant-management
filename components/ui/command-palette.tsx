'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, TableProperties, CalendarDays,
  ChefHat, UtensilsCrossed, BarChart3, Package, Users, Zap,
  Receipt, User, Coffee, AlertCircle,
} from 'lucide-react'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command'

const pages = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, shortcut: 'D' },
  { label: 'POS Terminal', href: '/pos', icon: ShoppingCart, shortcut: 'P' },
  { label: 'Tables', href: '/tables', icon: TableProperties, shortcut: 'T' },
  { label: 'Reservations', href: '/reservations', icon: CalendarDays },
  { label: 'Live Orders', href: '/orders', icon: Zap },
  { label: 'Kitchen Display', href: '/kitchen', icon: ChefHat, shortcut: 'K' },
  { label: 'Menu Management', href: '/menu', icon: UtensilsCrossed },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Staff', href: '/staff', icon: Users },
]

// Mock searchable items for global search
const mockSearchData = {
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

  // Filter search results based on input
  const filteredResults = useMemo(() => {
    if (!search.trim()) {
      return null
    }

    const query = search.toLowerCase()
    const results: Record<string, typeof mockSearchData.orders> = {}

    Object.entries(mockSearchData).forEach(([category, items]) => {
      const filtered = items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query)
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
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
      default:
        return LayoutDashboard
    }
  }

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages, orders, customers, tables, menu, staff, inventory..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {search.trim() ? (
          <>
            {Object.keys(filteredResults || {}).length === 0 ? (
              <CommandEmpty>No results found for "{search}"</CommandEmpty>
            ) : (
              <>
                {Object.entries(filteredResults || {}).map(([category, items]) => (
                  <div key={category}>
                    <CommandGroup heading={getCategoryLabel(category)}>
                      {items.map((item) => {
                        const Icon = getCategoryIcon(category)
                        return (
                          <CommandItem
                            key={item.id}
                            value={item.label}
                            onSelect={() => navigate(item.href)}
                          >
                            <Icon className="size-4 mr-2" />
                            <div className="flex flex-col">
                              <span className="text-sm">{item.label}</span>
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
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <CommandEmpty>Type to search or browse pages</CommandEmpty>

            <CommandGroup heading="Pages">
              {pages.map((page) => (
                <CommandItem
                  key={page.href}
                  value={page.label}
                  onSelect={() => navigate(page.href)}
                >
                  <page.icon className="size-4 mr-2" />
                  <span>{page.label}</span>
                  {page.shortcut && (
                    <CommandShortcut>⌘{page.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
