# Global Search Audit Report
## Restaurant Management System - Command Palette Implementation

**Date:** July 15, 2026  
**Scope:** Complete analysis of search data sources, backend integration, and frontend implementation  
**Status:** AUDIT COMPLETE - NO IMPLEMENTATION PERFORMED YET

---

## EXECUTIVE SUMMARY

The global search (Command Palette) is **currently using only mock/hardcoded data** in the frontend component. While backend repositories and API endpoints exist for most entities, they are **not integrated into the global search flow**.

**Current State:** 8 searchable categories with 3 mock items each = 24 mock results total  
**Backend Ready:** Yes, but isolated from search implementation  
**Real Data Integration:** 0% (all frontend mock data)

---

## 1. CURRENTLY SEARCHABLE ENTITIES (MOCK DATA ONLY)

### Frontend: Command Palette Component
**File:** `components/ui/command-palette.tsx`

**Search Flow:**
```
User Input (Ctrl+K) → CommandPalette Component
→ Client-side filter on mockSearchData object
→ Filter items by label.toLowerCase() or subtitle.toLowerCase()
→ Display grouped results
→ Navigate via router.push()
```

**Current Searchable Categories (All Mock):**

| # | Category | Mock Items | Backend Ready? | API Endpoint | Backend Search Method |
|---|----------|-----------|----------------|--------------|----------------------|
| 1 | **Navigation** | Dashboard, POS Terminal, Tables, Reservations, Live Orders, Kitchen, Menu Management, Analytics, Inventory, Billing, Settings, Staff | ✅ Yes | N/A (internal routes) | N/A |
| 2 | **Orders** | ORD-001, ORD-002, ORD-003 | ❌ No | `/api/orders/live` | `getLiveOrders()` (stub) |
| 3 | **Customers** | Rajesh Kumar, Priya Sharma, Amit Patel | ✅ Yes | `/api/crm/customers` | `CustomerRepository.search()` |
| 4 | **Tables** | Table 1, Table 2, Table 3 | ✅ Yes | `/api/tables` | `RestaurantTableRepository.findByBranch()` |
| 5 | **Reservations** | Res #201, Res #202 | ✅ Yes | `/api/reservations` | `ReservationRepository.findByBranch()` |
| 6 | **Menu** | Butter Chicken, Garlic Naan, Paneer Tikka | ✅ Yes | `/api/menu/items` | `MenuItemRepository.search()` |
| 7 | **Staff** | Vikram Singh, Deepak Verma, Neha Gupta | ✅ Yes | `/api/staff` | `UserRepository.findByRestaurant()` |
| 8 | **Inventory** | Saffron, Basmati Rice, Paneer | ✅ Yes | `/api/inventory/items` | `InventoryItemRepository.search()` |

**Missing Categories:**
- Restaurants (not in search)
- Branches (not in search)

---

## 2. SEARCHABLE ENTITIES - MISSING OR INCOMPLETE

### A. Completely Missing from Search
| Entity | Reason | Backend Repository | Search Method Available? |
|--------|--------|-------------------|--------------------------|
| **Restaurants** | Not in mockSearchData | `RestaurantRepository` | ❌ No - no search() method |
| **Branches** | Not in mockSearchData | `BranchRepository` | ❌ No - no search() method |

### B. Incomplete Backend Implementation
| Entity | Current State | Issue | TODO |
|--------|---------------|-------|------|
| **Orders** | API endpoint exists but returns empty | `getLiveOrders()` is stub | Implement with `OrderRepository.getLiveOrders()` |
| **Customers** | API endpoint exists but returns empty array | `/api/crm/customers` marked TODO | Implement with `CustomerRepository.search()` |
| **Staff** | API endpoint returns mock data only | `/api/staff` not connected to backend | Implement with `UserRepository.findByRestaurant()` |

---

## 3. BACKEND DATA SOURCES & ARCHITECTURE

### 3.1 Firestore Repository Layer
**Location:** `backend/src/repositories/`

**Repositories with Search Methods Implemented:**

```typescript
// 1. MenuItemRepository - FULLY IMPLEMENTED
async search(
  restaurantId: string,
  organizationId: string,
  searchTerm: string
): Promise<MenuItemDocument[]>
// Searches name and description fields
// Client-side filtering after Firestore fetch

// 2. InventoryItemRepository - FULLY IMPLEMENTED  
async search(
  branchId: string,
  restaurantId: string,
  organizationId: string,
  searchTerm: string
): Promise<InventoryItemDocument[]>
// Searches itemName and itemCode fields
// Client-side filtering after Firestore fetch

// 3. CustomerRepository - FULLY IMPLEMENTED
async search(
  organizationId: string,
  query: string
): Promise<CustomerDocument[]>
// Searches firstName, lastName, email, phone
// In-memory filtering (Firestore lacks full-text search)
```

**Repositories WITHOUT Search Methods:**

```typescript
// 1. OrderRepository - NO SEARCH METHOD
// Available: findByBranch(), findByStatus(), findByCustomer()
// Missing: search() method for global search

// 2. UserRepository (Staff) - NO SEARCH METHOD  
// Available: findByRestaurant(), findByRole(), findByStatus()
// Missing: search() method for filtering by name

// 3. RestaurantRepository - NO SEARCH METHOD
// Available: findByOrganization(), findBySlug()
// Missing: search() method for filtering by name

// 4. BranchRepository - NO SEARCH METHOD
// Available: findByRestaurant(), findByOrganization()
// Missing: search() method for filtering by name

// 5. RestaurantTableRepository - NO SEARCH METHOD
// Available: findByBranch(), findByTableNumber()
// Missing: search() method for filtering by number/name

// 6. ReservationRepository - NO SEARCH METHOD
// Available: findByBranch(), findByStatus(), findByDateRange()
// Missing: search() method for global search
```

---

## 4. API ENDPOINTS ANALYSIS

### 4.1 Existing API Endpoints (Proxy/Relay Pattern)

**Frontend API Endpoints (Next.js):**

| Route | Method | Returns | Status | Notes |
|-------|--------|---------|--------|-------|
| `/api/menu/items?branchId=X&search=Y` | GET | Menu items | ✅ Working | Relays to backend API |
| `/api/inventory/items?branchId=X&search=Y` | GET | Inventory items | ✅ Working | Uses InventoryService |
| `/api/crm/customers?branchId=X&search=Y` | GET | Customers | ❌ Stub | Returns empty array |
| `/api/staff?branchId=X` | GET | Staff | ⚠️ Mock | Mock data, no search integration |
| `/api/tables?branchId=X` | GET | Tables | ⚠️ Mock | Mock data only |
| `/api/orders/live?branchId=X` | GET | Orders | ❌ Stub | Returns empty orders |
| `/api/reservations?branchId=X` | GET | Reservations | ❌ Missing | Route doesn't exist |

### 4.2 Missing API Endpoints

| Entity | Required Endpoint | Current Status | Backend Repository Ready? |
|--------|-------------------|-----------------|--------------------------|
| **Restaurants** | `/api/restaurants?organizationId=X&search=Y` | ❌ Missing | ✅ Yes (RestaurantRepository) |
| **Branches** | `/api/branches?restaurantId=X&search=Y` | ❌ Missing | ✅ Yes (BranchRepository) |
| **Global Search** | `/api/search?q=X` (unified endpoint) | ❌ Missing | N/A - would need orchestrator |

---

## 5. SEARCH FLOW COMPARISON

### Current (Frontend-Only) Flow
```
┌─────────────────────────────────────────┐
│ User opens Command Palette (Ctrl+K)     │
├─────────────────────────────────────────┤
│ CommandPalette Component renders        │
│ - inputRef gets focus                   │
│ - mockSearchData loaded from memory     │
├─────────────────────────────────────────┤
│ User types search query                 │
├─────────────────────────────────────────┤
│ useMemo filters mockSearchData          │
│ - client-side filtering only            │
│ - NO backend calls                      │
├─────────────────────────────────────────┤
│ Results displayed in 8 categories       │
├─────────────────────────────────────────┤
│ User clicks result → router.push()      │
│ - No data persistence                   │
│ - No search history                     │
└─────────────────────────────────────────┘
```

### Required Backend-Integrated Flow
```
┌──────────────────────────────────────────────────────────┐
│ User opens Command Palette (Ctrl+K)                      │
├──────────────────────────────────────────────────────────┤
│ CommandPalette Component renders                         │
│ - inputRef gets focus                                    │
│ - Initial mockSearchData for UX (navigation items)       │
├──────────────────────────────────────────────────────────┤
│ User types search query (debounced)                      │
├──────────────────────────────────────────────────────────┤
│ Frontend calls /api/search?q=query                       │
│ ├─ Passes: branchId, restaurantId, organizationId       │
│ └─ Gets: users, auth context                            │
├──────────────────────────────────────────────────────────┤
│ Backend orchestrator queries multiple repositories:      │
│ ├─ MenuItemRepository.search()                           │
│ ├─ InventoryItemRepository.search()                      │
│ ├─ CustomerRepository.search()                           │
│ ├─ OrderRepository.search() [NEW]                        │
│ ├─ UserRepository.search() [NEW]                         │
│ ├─ ReservationRepository.search() [NEW]                  │
│ ├─ RestaurantTableRepository.search() [NEW]             │
│ ├─ RestaurantRepository.search() [NEW]                  │
│ └─ BranchRepository.search() [NEW]                      │
├──────────────────────────────────────────────────────────┤
│ Results aggregated and returned as JSON                  │
├──────────────────────────────────────────────────────────┤
│ Frontend groups and displays results                     │
├──────────────────────────────────────────────────────────┤
│ User clicks result → navigate + optional action          │
└──────────────────────────────────────────────────────────┘
```

---

## 6. WHAT'S REQUIRED TO COMPLETE GLOBAL SEARCH

### 6.1 Backend Changes Required

**Phase 1: Add Search Methods to Repositories**

| Repository | Method to Add | Searchable Fields | Estimated LOC |
|------------|---------------|-------------------|---------------|
| `OrderRepository` | `search(branchId, organizationId, searchTerm)` | orderNumber, status | 15-20 |
| `UserRepository` | `search(organizationId, searchTerm)` | firstName, lastName, email | 15-20 |
| `ReservationRepository` | `search(branchId, organizationId, searchTerm)` | id, customerName, status | 15-20 |
| `RestaurantTableRepository` | `search(branchId, organizationId, searchTerm)` | tableNumber, section | 15-20 |
| `RestaurantRepository` | `search(organizationId, searchTerm)` | name, slug | 10-15 |
| `BranchRepository` | `search(restaurantId, organizationId, searchTerm)` | name, address | 10-15 |

**Phase 2: Create Global Search Service**

- **File:** `backend/src/services/SearchService.ts` (NEW)
- **Purpose:** Orchestrate searches across all repositories
- **Responsibility:** 
  - Execute parallel searches on multiple repositories
  - Aggregate results with proper categorization
  - Handle errors gracefully (if one repo fails, others continue)
  - Apply tenant isolation (organizationId, branchId, restaurantId)
  - Estimated: 80-100 LOC

**Phase 3: Create Global Search API Endpoint**

- **File:** `app/api/search/route.ts` (NEW)
- **Endpoint:** `GET /api/search?q=<query>`
- **Query Parameters:**
  - `q` (required): Search query string
  - `branchId` (optional): Scope to branch
  - `limit` (optional, default: 50): Results per category
- **Response Format:**
```json
{
  "results": {
    "navigation": [...],
    "orders": [...],
    "customers": [...],
    "tables": [...],
    "reservations": [...],
    "menu": [...],
    "staff": [...],
    "inventory": [...],
    "restaurants": [...],
    "branches": [...]
  },
  "meta": {
    "query": "butter",
    "timestamp": "2026-07-15T10:30:00Z",
    "totalResults": 24
  }
}
```
- **Authentication:** Require user token for authorization
- **Estimated:** 40-60 LOC

### 6.2 Frontend Changes Required

**Phase 1: Update CommandPalette Component**

- **File:** `components/ui/command-palette.tsx` (MODIFY)
- **Changes:**
  - Add debounced API call to `/api/search`
  - Keep mockSearchData for immediate navigation display (UX)
  - Merge mock + real data
  - Show loading state while fetching
  - Handle errors gracefully
  - Cache results per query to reduce API calls
  - Estimated: 100-150 LOC

**Phase 2: Add Search Hook (Optional)**

- **File:** `hooks/useGlobalSearch.ts` (NEW)
- **Purpose:** Reusable search logic with debouncing, caching, error handling
- **Estimated:** 50-80 LOC

### 6.3 Infrastructure Changes

**No infrastructure changes required.** Existing Firestore setup supports all searches.

---

## 7. ENTITY-BY-ENTITY BREAKDOWN

### 1. Navigation Pages ✅
- **Current:** Mock data (12 items)
- **Backend:** N/A (hardcoded routes)
- **Action:** Keep as-is (no changes needed)

### 2. Orders ❌
- **Current:** Mock data (3 items)
- **Backend:** `OrderRepository.getLiveOrders()` exists but returns stub
- **Missing:** `OrderRepository.search()` method
- **API Integration:** `/api/orders/live` returns empty
- **Action Required:**
  1. Add `search()` method to OrderRepository
  2. Update `/api/orders/live` to use backend
  3. Update CommandPalette to call new endpoint

### 3. Customers ✅ (Backend Ready)
- **Current:** Mock data (3 items)
- **Backend:** `CustomerRepository.search()` fully implemented
- **API Integration:** `/api/crm/customers?search=X` exists but returns empty
- **Action Required:**
  1. Fix `/api/crm/customers` to call `CustomerRepository.search()`
  2. Update CommandPalette to call endpoint with debouncing

### 4. Tables ⚠️ (Partially Ready)
- **Current:** Mock data (3 items)
- **Backend:** `RestaurantTableRepository.findByBranch()` exists
- **Missing:** `search()` method for searching by table number/name
- **API Integration:** `/api/tables` returns mock only
- **Action Required:**
  1. Add `search()` method to RestaurantTableRepository
  2. Update `/api/tables` to support search parameter
  3. Update CommandPalette integration

### 5. Reservations ⚠️ (Partially Ready)
- **Current:** Mock data (2 items)
- **Backend:** `ReservationRepository.findByBranch()` exists
- **Missing:** `search()` method + API endpoint missing
- **API Integration:** `/api/reservations` doesn't exist
- **Action Required:**
  1. Create `/api/reservations?branchId=X&search=Y`
  2. Add `search()` method to ReservationRepository
  3. Update CommandPalette integration

### 6. Menu ✅ (Backend Ready)
- **Current:** Mock data (3 items)
- **Backend:** `MenuItemRepository.search()` fully implemented
- **API Integration:** `/api/menu/items?branchId=X&search=Y` exists and works
- **Action Required:**
  1. Update CommandPalette to call real endpoint instead of mock
  2. Add debouncing for better UX

### 7. Staff ✅ (Backend Ready)
- **Current:** Mock data (3 items)
- **Backend:** `UserRepository.findByRestaurant()` exists
- **Missing:** `search()` method + unified `/api/staff/search`
- **API Integration:** `/api/staff` returns mock data
- **Action Required:**
  1. Add `search()` method to UserRepository
  2. Update `/api/staff?search=X` endpoint
  3. Update CommandPalette integration

### 8. Inventory ✅ (Backend Ready)
- **Current:** Mock data (3 items)
- **Backend:** `InventoryItemRepository.search()` fully implemented
- **API Integration:** `/api/inventory/items?branchId=X&search=Y` exists and works
- **Action Required:**
  1. Update CommandPalette to call real endpoint instead of mock
  2. Add debouncing for better UX

### 9. Restaurants ❌ (Missing)
- **Current:** Not in search at all
- **Backend:** `RestaurantRepository.exists` but NO search() method
- **Missing:** Search method + API endpoint
- **Action Required:**
  1. Add `search()` method to RestaurantRepository
  2. Create `/api/restaurants?organizationId=X&search=Y`
  3. Add to CommandPalette mockSearchData

### 10. Branches ❌ (Missing)
- **Current:** Not in search at all
- **Backend:** `BranchRepository.exists` but NO search() method
- **Missing:** Search method + API endpoint
- **Action Required:**
  1. Add `search()` method to BranchRepository
  2. Create `/api/branches?restaurantId=X&search=Y`
  3. Add to CommandPalette mockSearchData

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Backend Search Methods (3-4 hours)
```
✓ OrderRepository.search()
✓ UserRepository.search() 
✓ ReservationRepository.search()
✓ RestaurantTableRepository.search()
✓ RestaurantRepository.search()
✓ BranchRepository.search()
```

### Phase 2: Global Search Service (2-3 hours)
```
✓ Create SearchService.ts
✓ Orchestrate parallel searches
✓ Handle error gracefully
✓ Return aggregated results
```

### Phase 3: Backend Search API (2-3 hours)
```
✓ Fix /api/crm/customers to call backend
✓ Create /api/search unified endpoint
✓ Update individual entity endpoints
✓ Add authentication + authorization
```

### Phase 4: Frontend Integration (3-4 hours)
```
✓ Add debounced API calls to CommandPalette
✓ Merge mock + real data
✓ Add loading states
✓ Implement result caching
✓ Handle errors gracefully
```

### Phase 5: Testing & Optimization (2-3 hours)
```
✓ Unit tests for search methods
✓ Integration tests for API
✓ Frontend e2e tests
✓ Performance optimization
```

---

## 9. KEY FINDINGS & RECOMMENDATIONS

### Critical Issues
1. **No Backend Integration:** Search is 100% frontend mock data
2. **Incomplete Stub Services:** Orders service returns empty data
3. **Missing Search Methods:** OrderRepository, UserRepository, etc. lack search()
4. **Missing API Endpoints:** No `/api/search` unified endpoint

### Strengths
1. **Repository Pattern Established:** All entities have base repositories
2. **Search Methods Exist:** MenuItemRepository and InventoryItemRepository have working search()
3. **API Proxy Pattern Ready:** Frontend proxy endpoints already relay to backend
4. **Firestore Integrated:** All data sources connected to Firestore

### Recommendations
1. **Priority 1:** Implement global search service and endpoint first (reusable architecture)
2. **Priority 2:** Add search() methods to remaining repositories (short, straightforward)
3. **Priority 3:** Update frontend to use real endpoints with debouncing
4. **Priority 4:** Add caching layer for frequently searched terms (future optimization)

---

## 10. DATA SOURCES SUMMARY TABLE

| Entity | Mock Data | Real Data Available | Backend Search | API Endpoint | Frontend Integration |
|--------|-----------|-------------------|-----------------|--------------|----------------------|
| Navigation | ✅ (12) | - | - | - | ✅ Direct |
| Orders | ✅ (3) | ❌ Stub | ❌ Missing | ⚠️ Stub | ✅ Mock only |
| Customers | ✅ (3) | ✅ Firestore | ✅ Exists | ⚠️ Stub | ✅ Mock only |
| Tables | ✅ (3) | ✅ Firestore | ❌ Missing | ⚠️ Mock | ✅ Mock only |
| Reservations | ✅ (2) | ✅ Firestore | ❌ Missing | ❌ Missing | ✅ Mock only |
| Menu | ✅ (3) | ✅ Firestore | ✅ Exists | ✅ Works | ✅ Mock only |
| Staff | ✅ (3) | ✅ Firestore | ❌ Missing | ⚠️ Mock | ✅ Mock only |
| Inventory | ✅ (3) | ✅ Firestore | ✅ Exists | ✅ Works | ✅ Mock only |
| Restaurants | ❌ - | ✅ Firestore | ❌ Missing | ❌ Missing | ❌ Not added |
| Branches | ❌ - | ✅ Firestore | ❌ Missing | ❌ Missing | ❌ Not added |

---

## 11. CONCLUSION

The Global Search implementation is **architecturally sound but operationally incomplete**. All backend data sources are available through Firestore repositories, but the frontend is disconnected from them, relying entirely on mock data.

**To enable real Global Search covering all 10 entities (Navigation, Orders, Customers, Staff, Menu, Tables, Reservations, Inventory, Restaurants, Branches):**

1. Add 6 search() methods to backend repositories (straightforward implementations)
2. Create a SearchService to orchestrate parallel searches
3. Expose `/api/search` unified endpoint
4. Update CommandPalette to call backend with debouncing
5. Keep mock data for UX (immediate navigation display)

**Estimated Total Effort:** 12-17 hours (1.5-2 engineering days)

---

## APPENDIX A: File Locations Reference

### Frontend Files
- `components/ui/command-palette.tsx` - Main search component
- `components/layout/top-navbar.tsx` - Search trigger button
- `hooks/` - Location for new useGlobalSearch hook

### Backend Repositories
- `backend/src/repositories/CustomerRepository.ts` - ✅ Has search()
- `backend/src/repositories/MenuItemRepository.ts` - ✅ Has search()
- `backend/src/repositories/InventoryItemRepository.ts` - ✅ Has search()
- `backend/src/repositories/OrderRepository.ts` - ❌ Needs search()
- `backend/src/repositories/UserRepository.ts` - ❌ Needs search()
- `backend/src/repositories/ReservationRepository.ts` - ❌ Needs search()
- `backend/src/repositories/RestaurantTableRepository.ts` - ❌ Needs search()
- `backend/src/repositories/RestaurantRepository.ts` - ❌ Needs search()
- `backend/src/repositories/BranchRepository.ts` - ❌ Needs search()

### API Endpoints
- `app/api/crm/customers/route.ts` - ⚠️ Stub
- `app/api/menu/items/route.ts` - ✅ Works
- `app/api/inventory/items/route.ts` - ✅ Works
- `app/api/orders/live/route.ts` - ❌ Stub
- `app/api/staff/route.ts` - ⚠️ Mock only
- `app/api/tables/route.ts` - ⚠️ Mock only
- `app/api/reservations/` - ❌ Missing

### Backend Services
- `backend/src/services/` - Where SearchService should be created
- `api/services/orders.service.ts` - Stub (needs implementation)

---

## APPENDIX B: Repository Search Method Template

```typescript
async search(
  branchId: string,           // or restaurantId/organizationId as needed
  organizationId: string,
  searchTerm: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<EntityDocument[]> {
  try {
    const filters = [
      { field: 'branchId', operator: '==' as const, value: branchId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      { field: 'isDeleted', operator: '==' as const, value: false },
    ]

    const allItems = await this.findMany({ filters })

    // Client-side filtering (Firestore lacks full-text search)
    const searchLower = searchTerm.toLowerCase()
    return allItems.filter(
      (item) =>
        item.fieldName1.toLowerCase().includes(searchLower) ||
        item.fieldName2?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error(`Error searching entities:`, error)
    return []
  }
}
```

---

**Report Generated:** July 15, 2026  
**Next Step:** Awaiting approval to proceed with Phase 1 implementation
