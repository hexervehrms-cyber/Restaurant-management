# Global Search - Quick Summary

## Current State vs. Required State

### 🔴 CURRENT STATE (Mock Data Only)
```
CommandPalette Component
    └─ mockSearchData (hardcoded in component)
       ├─ Navigation (12 items) ✅
       ├─ Orders (3 mock items) ❌ Real data available
       ├─ Customers (3 mock items) ❌ Real data available
       ├─ Tables (3 mock items) ❌ Real data available
       ├─ Reservations (2 mock items) ❌ Real data available
       ├─ Menu (3 mock items) ❌ Real data available
       ├─ Staff (3 mock items) ❌ Real data available
       ├─ Inventory (3 mock items) ❌ Real data available
       ├─ Restaurants (NOT ADDED) ❌ Real data available
       └─ Branches (NOT ADDED) ❌ Real data available

Search Flow: User types → Filter mockSearchData → Display
No backend calls. No real data. No persistence.
```

---

### 🟢 REQUIRED STATE (Real Data from Firestore)
```
CommandPalette Component
    └─ useGlobalSearch hook (debounced API calls)
       └─ GET /api/search?q=query
           ├─ Backend SearchService
           │   ├─ MenuItemRepository.search() ✅ READY
           │   ├─ InventoryItemRepository.search() ✅ READY
           │   ├─ CustomerRepository.search() ✅ READY
           │   ├─ OrderRepository.search() ❌ TO ADD
           │   ├─ UserRepository.search() ❌ TO ADD
           │   ├─ ReservationRepository.search() ❌ TO ADD
           │   ├─ RestaurantTableRepository.search() ❌ TO ADD
           │   ├─ RestaurantRepository.search() ❌ TO ADD
           │   └─ BranchRepository.search() ❌ TO ADD
           └─ Firestore (real data)

Search Flow: User types → Debounce → API call → Backend search → Aggregate results → Display
Real backend data. Persistent. Scalable.
```

---

## What's Ready vs. What's Missing

### ✅ READY NOW (Implementation exists)
- MenuItemRepository.search() - searches by name, description
- InventoryItemRepository.search() - searches by itemName, itemCode
- CustomerRepository.search() - searches by name, email, phone
- API endpoints for menu & inventory (working)

### ⚠️ PARTIALLY READY (Stubs exist but incomplete)
- OrderRepository - has methods but no search()
- UserRepository - has methods but no search() for staff
- ReservationRepository - has methods but no search()
- RestaurantTableRepository - has methods but no search()
- API endpoints return mock/empty data

### ❌ MISSING (Need to create)
- RestaurantRepository.search()
- BranchRepository.search()
- API endpoint `/api/search` (unified search)
- API endpoint `/api/reservations` 
- Backend SearchService to orchestrate searches
- Frontend hook to debounce and call API

---

## Data Summary

| Category | Searchable Now? | Mock Items | Real Data Available? | Backend Search | Frontend Call |
|----------|---|---|---|---|---|
| Navigation | ✅ | 12 | - | - | Direct |
| Menu | ✅* | 3 | ✅ | ✅ | Mock |
| Inventory | ✅* | 3 | ✅ | ✅ | Mock |
| Customers | ❌ | 3 | ✅ | ✅ | Mock |
| Orders | ❌ | 3 | ⚠️ (stub) | ❌ | Mock |
| Staff | ❌ | 3 | ✅ | ❌ | Mock |
| Tables | ❌ | 3 | ✅ | ❌ | Mock |
| Reservations | ❌ | 2 | ✅ | ❌ | Mock |
| Restaurants | ❌ | 0 | ✅ | ❌ | Missing |
| Branches | ❌ | 0 | ✅ | ❌ | Missing |

*Menu & Inventory have search() methods but frontend still uses mock data

---

## Work Breakdown

### Backend (7-10 hours)
**Search Methods (3-4 hours):**
- [ ] OrderRepository.search()
- [ ] UserRepository.search()
- [ ] ReservationRepository.search()
- [ ] RestaurantTableRepository.search()
- [ ] RestaurantRepository.search()
- [ ] BranchRepository.search()

**Search Service (2-3 hours):**
- [ ] Create SearchService.ts
- [ ] Orchestrate parallel searches
- [ ] Aggregate results with categories

**API Endpoint (2-3 hours):**
- [ ] Create /api/search route
- [ ] Wire up SearchService
- [ ] Add auth & validation

### Frontend (3-5 hours)
**CommandPalette Updates (2-3 hours):**
- [ ] Add debounced API calls
- [ ] Merge mock + real data
- [ ] Add loading states
- [ ] Error handling

**Optional (1-2 hours):**
- [ ] Create useGlobalSearch hook
- [ ] Add result caching
- [ ] Performance optimization

### Testing (2-3 hours)
- [ ] Unit tests for search methods
- [ ] Integration tests
- [ ] E2E tests for UI

**Total: 12-18 hours (1.5-2.5 days)**

---

## Why This Matters

### Problems with Current Implementation
1. ❌ Search only works with 3 hardcoded items per category
2. ❌ Adding new orders, customers, etc. requires code changes
3. ❌ No real data - mock data becomes stale
4. ❌ Can't scale to multiple restaurants/branches
5. ❌ No search history or analytics possible

### Benefits of Real Backend Integration
1. ✅ Live data - always current
2. ✅ Scalable - works with thousands of items
3. ✅ Searchable - all Firestore records included
4. ✅ Fast - backend filtering + Firestore indexes
5. ✅ Persistent - can track search queries
6. ✅ Secure - tenant isolation enforced
7. ✅ Enterprise-ready - supports multi-restaurant setups

---

## Key Files to Modify/Create

### Modify
- `components/ui/command-palette.tsx` - Add backend calls, debouncing
- `app/api/crm/customers/route.ts` - Call backend instead of stub
- `app/api/staff/route.ts` - Connect to real data
- `app/api/tables/route.ts` - Connect to real data

### Create
- `backend/src/services/SearchService.ts` - Orchestrator
- `app/api/search/route.ts` - Unified search endpoint
- `app/api/reservations/route.ts` - Missing endpoint
- `hooks/useGlobalSearch.ts` - Frontend hook (optional)

### Extend (Add search methods)
- `backend/src/repositories/OrderRepository.ts`
- `backend/src/repositories/UserRepository.ts`
- `backend/src/repositories/ReservationRepository.ts`
- `backend/src/repositories/RestaurantTableRepository.ts`
- `backend/src/repositories/RestaurantRepository.ts`
- `backend/src/repositories/BranchRepository.ts`

---

## No Mock Data to Real Data Translation

The mock data in CommandPalette is **NOT** imported from anywhere - it's hardcoded directly in the component:

```typescript
const mockSearchData = {
  orders: [
    { id: 'ORD-001', label: 'Order ORD-001', subtitle: 'Table 5 — ₹2,450', href: '/orders' },
    // ... more hardcoded items
  ],
  // ...
}
```

**What needs to happen:**
1. Remove hardcoded mockSearchData for Orders, Customers, etc.
2. Call `/api/search` endpoint instead
3. Backend returns real Firestore data
4. Frontend displays real data in same format
5. Keep Navigation mock (it's just routes, no data needed)

---

## Recommendation

**Phase 1 Priority:** Create the `/api/search` unified endpoint first
- This is the bottleneck that enables all other work
- Once it exists, frontend and individual entity endpoints can be updated in parallel
- Clean architecture that can be reused for other features

Then proceed with adding search() methods to repositories and connecting frontend.

---

## Audit Complete ✅

All findings documented in **GLOBAL_SEARCH_AUDIT_REPORT.md**

No implementation has been performed. Ready for approval to proceed.
