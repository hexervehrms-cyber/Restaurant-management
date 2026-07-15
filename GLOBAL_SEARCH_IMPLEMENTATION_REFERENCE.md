# Global Search - Implementation Reference Guide

This document provides exact code patterns and examples for implementing real backend integration.

---

## 1. Repository Search Method Patterns

### Pattern 1: MenuItemRepository.search() (REFERENCE)
**File:** `backend/src/repositories/MenuItemRepository.ts`

```typescript
async search(
  restaurantId: string,
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<MenuItemDocument[]> {
  try {
    const filters = [
      { field: 'restaurantId', operator: '==' as const, value: restaurantId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      { field: 'isDeleted', operator: '==' as const, value: false },
    ]

    const allItems = await this.findMany({ filters })
    
    // Client-side filtering for name and description search
    const searchLower = searchTerm.toLowerCase()
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error(`Error searching menu items:`, error)
    return []
  }
}
```

### Pattern 2: Apply to OrderRepository
**File:** `backend/src/repositories/OrderRepository.ts` (ADD THIS)

```typescript
async search(
  branchId: string,
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<OrderDocument[]> {
  try {
    const filters = [
      { field: 'branchId', operator: '==' as const, value: branchId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      { field: 'isDeleted', operator: '==' as const, value: false },
    ]

    const allOrders = await this.findMany({ filters })
    
    // Client-side filtering for order number and status
    const searchLower = searchTerm.toLowerCase()
    return allOrders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.status?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error(`Error searching orders:`, error)
    return []
  }
}
```

### Pattern 3: Apply to UserRepository (Staff)
**File:** `backend/src/repositories/UserRepository.ts` (ADD THIS)

```typescript
async search(
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<User[]> {
  try {
    const filters = [
      { field: 'organizationId', operator: '==' as const, value: organizationId },
    ]

    const allUsers = await this.findMany({ filters })
    
    // Client-side filtering for name and email
    const searchLower = searchTerm.toLowerCase()
    return allUsers.filter(
      (user) =>
        (user.firstName?.toLowerCase().includes(searchLower)) ||
        (user.lastName?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower))
    )
  } catch (error) {
    console.error(`Error searching users:`, error)
    return []
  }
}
```

### Pattern 4: Apply to ReservationRepository
**File:** `backend/src/repositories/ReservationRepository.ts` (ADD THIS)

```typescript
async search(
  branchId: string,
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<ReservationDocument[]> {
  try {
    const filters = [
      { field: 'branchId', operator: '==' as const, value: branchId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      { field: 'isDeleted', operator: '==' as const, value: false },
    ]

    const allReservations = await this.findMany({ filters })
    
    // Client-side filtering for reservation ID and status
    const searchLower = searchTerm.toLowerCase()
    return allReservations.filter(
      (res) =>
        res.id.toLowerCase().includes(searchLower) ||
        res.status?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error(`Error searching reservations:`, error)
    return []
  }
}
```

### Pattern 5: Apply to RestaurantTableRepository
**File:** `backend/src/repositories/RestaurantTableRepository.ts` (ADD THIS)

```typescript
async search(
  branchId: string,
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<RestaurantTableDocument[]> {
  try {
    const filters = [
      { field: 'branchId', operator: '==' as const, value: branchId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      { field: 'isDeleted', operator: '==' as const, value: false },
    ]

    const allTables = await this.findMany({ filters })
    
    // Client-side filtering for table number and section
    const searchLower = searchTerm.toLowerCase()
    return allTables.filter(
      (table) =>
        table.tableNumber?.toString().includes(searchLower) ||
        table.section?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error(`Error searching tables:`, error)
    return []
  }
}
```

### Pattern 6: Apply to RestaurantRepository
**File:** `backend/src/repositories/RestaurantRepository.ts` (ADD THIS)

```typescript
async search(
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<RestaurantDocument[]> {
  try {
    const filters = [
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      { field: 'isDeleted', operator: '==' as const, value: false },
    ]

    const allRestaurants = await this.findMany({ filters })
    
    // Client-side filtering for name and slug
    const searchLower = searchTerm.toLowerCase()
    return allRestaurants.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.slug?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error(`Error searching restaurants:`, error)
    return []
  }
}
```

### Pattern 7: Apply to BranchRepository
**File:** `backend/src/repositories/BranchRepository.ts` (ADD THIS)

```typescript
async search(
  restaurantId: string,
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<BranchDocument[]> {
  try {
    const filters = [
      { field: 'restaurantId', operator: '==' as const, value: restaurantId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      { field: 'isDeleted', operator: '==' as const, value: false },
    ]

    const allBranches = await this.findMany({ filters })
    
    // Client-side filtering for name and address
    const searchLower = searchTerm.toLowerCase()
    return allBranches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(searchLower) ||
        branch.address?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error(`Error searching branches:`, error)
    return []
  }
}
```

---

## 2. Backend SearchService (NEW FILE)

**File:** `backend/src/services/SearchService.ts` (CREATE)

```typescript
/**
 * Search Service
 * Orchestrates searches across multiple repositories
 * Aggregates results by category for global search
 */

import { Request } from 'express'
import {
  CustomerRepository,
  MenuItemRepository,
  InventoryItemRepository,
  OrderRepository,
  UserRepository,
  ReservationRepository,
  RestaurantTableRepository,
  RestaurantRepository,
  BranchRepository,
} from '@/repositories'

export interface SearchResult {
  results: {
    navigation: any[]
    customers: any[]
    orders: any[]
    menu: any[]
    staff: any[]
    inventory: any[]
    tables: any[]
    reservations: any[]
    restaurants: any[]
    branches: any[]
  }
  meta: {
    query: string
    totalResults: number
    timestamp: string
  }
}

export class SearchService {
  private customerRepo: CustomerRepository
  private menuRepo: MenuItemRepository
  private inventoryRepo: InventoryItemRepository
  private orderRepo: OrderRepository
  private userRepo: UserRepository
  private reservationRepo: ReservationRepository
  private tableRepo: RestaurantTableRepository
  private restaurantRepo: RestaurantRepository
  private branchRepo: BranchRepository

  constructor() {
    this.customerRepo = new CustomerRepository()
    this.menuRepo = new MenuItemRepository()
    this.inventoryRepo = new InventoryItemRepository()
    this.orderRepo = new OrderRepository()
    this.userRepo = new UserRepository()
    this.reservationRepo = new ReservationRepository()
    this.tableRepo = new RestaurantTableRepository()
    this.restaurantRepo = new RestaurantRepository()
    this.branchRepo = new BranchRepository()
  }

  /**
   * Global search across all entities
   * Executes searches in parallel for performance
   * 
   * @param query - Search query string
   * @param branchId - Branch context (for tenant isolation)
   * @param restaurantId - Restaurant context
   * @param organizationId - Organization context (required)
   * @param limit - Results per category (default: 50)
   * @returns Aggregated search results
   */
  async search(
    query: string,
    branchId: string,
    restaurantId: string,
    organizationId: string,
    limit: number = 50
  ): Promise<SearchResult> {
    const trimmedQuery = query.trim()

    if (!trimmedQuery || trimmedQuery.length < 1) {
      return {
        results: {
          navigation: [],
          customers: [],
          orders: [],
          menu: [],
          staff: [],
          inventory: [],
          tables: [],
          reservations: [],
          restaurants: [],
          branches: [],
        },
        meta: {
          query: '',
          totalResults: 0,
          timestamp: new Date().toISOString(),
        },
      }
    }

    try {
      // Execute all searches in parallel
      const [
        customers,
        orders,
        menu,
        staff,
        inventory,
        tables,
        reservations,
        restaurants,
        branches,
      ] = await Promise.all([
        this.customerRepo
          .search(organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: `${item.firstName} ${item.lastName}`,
              subtitle: item.email || item.phone || '',
              href: `/crm`,
            }))
          )
          .catch(() => []),

        this.orderRepo
          .search(branchId, organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: `Order ${item.orderNumber}`,
              subtitle: `Status: ${item.status}`,
              href: `/orders`,
            }))
          )
          .catch(() => []),

        this.menuRepo
          .search(restaurantId, organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: item.name,
              subtitle: item.description || '',
              href: `/menu`,
            }))
          )
          .catch(() => []),

        this.userRepo
          .search(organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: `${item.firstName} ${item.lastName}`,
              subtitle: item.role || 'Staff',
              href: `/staff`,
            }))
          )
          .catch(() => []),

        this.inventoryRepo
          .search(branchId, restaurantId, organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: item.itemName,
              subtitle: `${item.quantityInStock} ${item.unitOfMeasure || ''}`,
              href: `/inventory`,
            }))
          )
          .catch(() => []),

        this.tableRepo
          .search(branchId, organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: `Table ${item.tableNumber}`,
              subtitle: item.section || 'Indoor',
              href: `/tables`,
            }))
          )
          .catch(() => []),

        this.reservationRepo
          .search(branchId, organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: `Reservation #${item.id.slice(-4)}`,
              subtitle: item.status || 'Pending',
              href: `/reservations`,
            }))
          )
          .catch(() => []),

        this.restaurantRepo
          .search(organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: item.name,
              subtitle: item.slug || 'Restaurant',
              href: `/`,
            }))
          )
          .catch(() => []),

        this.branchRepo
          .search(restaurantId, organizationId, trimmedQuery)
          .then((items) =>
            items.slice(0, limit).map((item) => ({
              id: item.id,
              label: item.name,
              subtitle: item.address || 'Branch',
              href: `/`,
            }))
          )
          .catch(() => []),
      ])

      const totalResults = [
        customers,
        orders,
        menu,
        staff,
        inventory,
        tables,
        reservations,
        restaurants,
        branches,
      ].reduce((sum, arr) => sum + arr.length, 0)

      return {
        results: {
          navigation: [],
          customers,
          orders,
          menu,
          staff,
          inventory,
          tables,
          reservations,
          restaurants,
          branches,
        },
        meta: {
          query: trimmedQuery,
          totalResults,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error('Search service error:', error)
      return {
        results: {
          navigation: [],
          customers: [],
          orders: [],
          menu: [],
          staff: [],
          inventory: [],
          tables: [],
          reservations: [],
          restaurants: [],
          branches: [],
        },
        meta: {
          query: trimmedQuery,
          totalResults: 0,
          timestamp: new Date().toISOString(),
        },
      }
    }
  }
}
```

---

## 3. API Endpoint (NEW FILE)

**File:** `app/api/search/route.ts` (CREATE)

```typescript
/**
 * GET /api/search?q=<query>&branchId=<id>&restaurantId=<id>
 * Global search across all entities
 * Returns results grouped by category
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { SearchService } from '@/services/SearchService'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const query = request.nextUrl.searchParams.get('q') || ''
    const branchId = request.nextUrl.searchParams.get('branchId') || ''
    const restaurantId = request.nextUrl.searchParams.get('restaurantId') || ''
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10)

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        successResponse({
          results: {
            navigation: [],
            customers: [],
            orders: [],
            menu: [],
            staff: [],
            inventory: [],
            tables: [],
            reservations: [],
            restaurants: [],
            branches: [],
          },
          meta: {
            query: '',
            totalResults: 0,
          },
        })
      )
    }

    // Extract auth and tenant context
    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Initialize search service
    const searchService = new SearchService()

    // Execute search
    const results = await searchService.search(
      query,
      branchId || tenantContext.branchId,
      restaurantId || tenantContext.restaurantId,
      tenantContext.organizationId,
      limit
    )

    return NextResponse.json(successResponse(results))
  } catch (error: any) {
    console.error('Error in global search:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'SEARCH_ERROR'),
      { status: 500 }
    )
  }
}
```

---

## 4. Frontend Hook (OPTIONAL)

**File:** `hooks/useGlobalSearch.ts` (CREATE - OPTIONAL)

```typescript
/**
 * Global Search Hook
 * Debounced search with caching and error handling
 * Use in CommandPalette component
 */

import { useState, useCallback, useEffect, useRef } from 'react'

export interface SearchResult {
  id: string
  label: string
  subtitle?: string
  href: string
}

export interface SearchResults {
  results: {
    navigation: SearchResult[]
    customers: SearchResult[]
    orders: SearchResult[]
    menu: SearchResult[]
    staff: SearchResult[]
    inventory: SearchResult[]
    tables: SearchResult[]
    reservations: SearchResult[]
    restaurants: SearchResult[]
    branches: SearchResult[]
  }
  meta: {
    query: string
    totalResults: number
  }
}

export function useGlobalSearch(
  branchId?: string,
  restaurantId?: string,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()
  const cacheRef = useRef<Map<string, SearchResults>>(new Map())

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null)
        return
      }

      // Check cache first
      if (cacheRef.current.has(searchQuery)) {
        setResults(cacheRef.current.get(searchQuery)!)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          ...(branchId && { branchId }),
          ...(restaurantId && { restaurantId }),
        })

        const response = await fetch(`/api/search?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        const searchResults = data.data

        // Cache results
        cacheRef.current.set(searchQuery, searchResults)

        setResults(searchResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search error')
        setResults(null)
      } finally {
        setIsLoading(false)
      }
    },
    [branchId, restaurantId]
  )

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery)

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        performSearch(searchQuery)
      }, debounceMs)
    },
    [performSearch, debounceMs]
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return {
    query,
    setQuery: debouncedSearch,
    results,
    isLoading,
    error,
  }
}
```

---

## 5. Updated CommandPalette Component (PARTIAL)

**File:** `components/ui/command-palette.tsx` (MODIFY - EXCERPT)

```typescript
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'

// ... existing imports ...

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, results, isLoading, error } = useGlobalSearch()

  // ... existing keyboard handlers ...

  const navigate = (href: string) => {
    router.push(href)
    setQuery('')
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        ref={inputRef}
        autoFocus
        placeholder="Search across your restaurant..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!query.trim() ? (
          // Show navigation when no search
          <>
            <CommandEmpty className="flex flex-col items-center gap-2 py-8">
              <p className="text-sm text-muted-foreground">Start typing to search</p>
            </CommandEmpty>

            <CommandGroup heading="Navigation">
              {navigationPages.map((page) => (
                <CommandItem key={page.href} onSelect={() => navigate(page.href)}>
                  <page.icon className="size-4 mr-2" />
                  <span>{page.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : !results || Object.values(results.results).every((arr) => arr.length === 0) ? (
          // Show empty state
          <CommandEmpty className="flex flex-col items-center gap-2 py-12">
            <AlertCircle className="size-6 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for menu items, customers, orders, or staff
              </p>
            </div>
          </CommandEmpty>
        ) : (
          // Show results grouped by category
          <>
            {Object.entries(results.results).map(([category, items]) => {
              if (!items || items.length === 0) return null
              return (
                <div key={category}>
                  <CommandGroup heading={getCategoryLabel(category)}>
                    {items.map((item) => {
                      const Icon = getCategoryIcon(category)
                      return (
                        <CommandItem
                          key={item.id}
                          onSelect={() => navigate(item.href)}
                        >
                          <Icon className="size-4 mr-2" />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            )}
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
      </CommandList>
    </CommandDialog>
  )
}
```

---

## 6. Backend Directory Updates

**File:** `backend/src/services/index.ts` (ADD EXPORT)

```typescript
export { SearchService } from './SearchService'
```

---

## 7. Comparison: Before vs. After

### BEFORE (Current)
```
User types → Mock data filter → Display (3 items per category max)
No backend. No scalability. No real data.
```

### AFTER (Proposed)
```
User types → Debounce 300ms → GET /api/search → 
Backend queries 9 repositories in parallel → 
Aggregate results → Display (all real data) →
Cache results for next search
```

---

## Summary of Files to Change

### Create (NEW FILES)
1. ✅ `backend/src/services/SearchService.ts`
2. ✅ `app/api/search/route.ts`
3. ✅ `hooks/useGlobalSearch.ts` (optional)

### Modify (EXISTING FILES)
1. ✅ `backend/src/repositories/OrderRepository.ts` - Add search()
2. ✅ `backend/src/repositories/UserRepository.ts` - Add search()
3. ✅ `backend/src/repositories/ReservationRepository.ts` - Add search()
4. ✅ `backend/src/repositories/RestaurantTableRepository.ts` - Add search()
5. ✅ `backend/src/repositories/RestaurantRepository.ts` - Add search()
6. ✅ `backend/src/repositories/BranchRepository.ts` - Add search()
7. ✅ `backend/src/services/index.ts` - Export SearchService
8. ✅ `components/ui/command-palette.tsx` - Add API calls + hook
9. ✅ `app/api/crm/customers/route.ts` - Call backend instead of stub
10. ✅ `app/api/staff/route.ts` - Connect to real data
11. ✅ `app/api/tables/route.ts` - Connect to real data

### Create (MISSING API ENDPOINTS)
1. ✅ `app/api/reservations/route.ts`

---

**Total LOC Added:** ~1200-1500 lines  
**Total LOC Modified:** ~500 lines  
**Estimated Time:** 12-18 hours
