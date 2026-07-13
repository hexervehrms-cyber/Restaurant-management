# DISCOVERY REPORT - Phase 6.2.8: Customer Module Migration

**Phase Status:** DISCOVERY COMPLETE  
**Migration Scope:** Customer Module (Phase 6.2.8)  
**Date:** 2026-07-13  
**Objective:** Migrate Customer module from Prisma to Firestore

---

## EXECUTIVE SUMMARY

### Scope Definition
The Customer module encompasses **4 Prisma models** and their relationships:
- **Customer** - Main entity (organizationId-scoped)
- **CustomerAddress** - Nested subcollection
- **CustomerNote** - Nested subcollection  
- **CustomerLoyaltyPoints** - Nested subcollection (1:1)

### Current State
- **Database:** Prisma ORM (PostgreSQL backend)
- **API:** REST endpoints using Prisma directly
- **Firestore:** Collections defined but repositories not created
- **Validation:** Manual (no schemas)
- **Relationships:** Customer → Orders, Bills, Payments, Reservations

---

## 1. PRISMA SCHEMA ANALYSIS

### Customer Model
```
id: UUID @id @default(uuid())
organizationId: UUID @fk(Organization)
phone: String? @unique(organizationId)
email: String?
firstName: String?
lastName: String?
dateOfBirth: DateTime?
gender: String?
profilePictureUrl: String?
totalOrders: Int @default(0)
totalSpent: Decimal(12, 2)
preferredLanguage: String?
status: String @default("active")
customerSource: String?
metadata: Json @default("{}")
timestamps: createdAt, updatedAt, deletedAt

Relations:
├─ organization: Organization @relation(onDelete: Cascade)
├─ addresses: CustomerAddress[]
├─ notes: CustomerNote[]
├─ loyaltyPoints: CustomerLoyaltyPoints?
├─ reservations: Reservation[]
├─ orders: Order[]
├─ bills: Bill[]
└─ payments: Payment[]
```

### CustomerAddress Model (Subcollection)
```
id: UUID
customerId: UUID @fk(Customer, onDelete: Cascade)
organizationId: UUID
addressType: String? (e.g., "home", "office", "delivery")
addressLine1: String
addressLine2: String?
city: String?
state: String?
postalCode: String?
latitude: Decimal(10, 8)?
longitude: Decimal(11, 8)?
isDefault: Boolean @default(false)
timestamps: createdAt, updatedAt, deletedAt

Index: customerId
```

### CustomerNote Model (Subcollection)
```
id: UUID
customerId: UUID @fk(Customer, onDelete: Cascade)
organizationId: UUID
note: String?
createdBy: UUID @fk(User, onDelete: SetNull)?
timestamps: createdAt, updatedAt, deletedAt

Index: customerId
Relation: user (optional)
```

### CustomerLoyaltyPoints Model (1:1 Relationship)
```
id: UUID @unique
customerId: UUID @unique @fk(Customer, onDelete: Cascade)
organizationId: UUID
pointsBalance: Int @default(0)
lifetimePoints: Int @default(0)
lastEarnedAt: DateTime?
lastRedeemedAt: DateTime?
timestamps: createdAt, updatedAt, deletedAt

Relation: customer (1:1)
```

---

## 2. FIRESTORE DESIGN

### Collections Already Defined
✓ `COLLECTIONS.customers` - Configured  
✓ `SUBCOLLECTION_PATHS.customerAddresses(customerId)` - Configured  
✓ `SUBCOLLECTION_PATHS.customerNotes(customerId)` - Configured  
✓ `SUBCOLLECTION_PATHS.customerLoyaltyPoints(customerId)` - Configured  

### Document Type Hierarchy

#### Customer (RestaurantScopedDocument)
```typescript
extends BaseDocument
├─ id: DocumentId
├─ organizationId: string ✓ (BaseDocument)
├─ restaurantId: string (from RestaurantScopedDocument)
├─ isActive?: boolean (BaseDocument)
├─ createdAt, updatedAt, createdBy, updatedBy (AuditFields)
├─ deletedAt, isDeleted, deletedBy (SoftDeleteFields)
│
├─ phone: string
├─ email: string | null
├─ firstName: string | null
├─ lastName: string | null
├─ dateOfBirth: FirestoreTimestamp | null
├─ gender: string | null
├─ profilePictureUrl: string | null
├─ totalOrders: number
├─ totalSpent: FirestoreNumeric
├─ preferredLanguage: string | null
├─ status: "active" | "inactive" | "blocked"
├─ customerSource: string | null
├─ metadata: Record<string, any>
│
└─ relationships: (denormalized references)
   ├─ (addresses) - via subcollection
   ├─ (notes) - via subcollection
   ├─ (loyaltyPoints) - via subcollection
```

#### CustomerAddress (Nested in Customer)
```typescript
extends BaseDocument
├─ customerId: DocumentId (parent)
├─ addressType: string | null
├─ addressLine1: string
├─ addressLine2: string | null
├─ city: string | null
├─ state: string | null
├─ postalCode: string | null
├─ latitude: FirestoreNumeric | null
├─ longitude: FirestoreNumeric | null
├─ isDefault: boolean
```

#### CustomerNote (Nested in Customer)
```typescript
extends BaseDocument
├─ customerId: DocumentId (parent)
├─ note: string | null
├─ createdBy: string | null
```

#### CustomerLoyaltyPoints (Nested in Customer)
```typescript
extends BaseDocument
├─ customerId: DocumentId (parent)
├─ pointsBalance: number
├─ lifetimePoints: number
├─ lastEarnedAt: FirestoreTimestamp | null
├─ lastRedeemedAt: FirestoreTimestamp | null
```

---

## 3. PRISMA DATABASE OPERATIONS (TO BE MIGRATED)

### Direct Prisma Calls Found

#### Route: `/api/crm/customers?branchId=<id>&search=""`
**Files:**
- `backend/app/api/crm/customers/route.ts`
- `app/api/crm/customers/route.ts`
- `frontend/app/api/crm/customers/route.ts`

**Operations:**
```typescript
// findMany - with search and includes
prisma.customer.findMany({
  where: {
    restaurantId,
    organizationId,
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  },
  include: { loyaltyPoints: true, addresses: true },
  orderBy: { createdAt: 'desc' },
  take: 100
})
```

#### Route: `/api/pos/customers/search?query=<phoneOrName>`
**Files:**
- `backend/app/api/pos/customers/search/route.ts`
- `app/api/pos/customers/search/route.ts`
- `frontend/app/api/pos/customers/search/route.ts`

**Operations:**
```typescript
// findMany - with search filters
prisma.customer.findMany({
  where: {
    organizationId,
    deletedAt: null,
    OR: [
      { phone: { contains: query, mode: 'insensitive' } },
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } }
    ]
  },
  select: { id, phone, firstName, lastName, email },
  take: 10
})
```

#### Route: `/api/pos/customers`
**Files:**
- `backend/app/api/pos/customers/route.ts`
- `app/api/pos/customers/route.ts`
- `frontend/app/api/pos/customers/route.ts`

**Operations:**
```typescript
// findFirst - deduplication check
prisma.customer.findFirst({
  where: {
    organizationId,
    phone,
    deletedAt: null
  }
})

// create - new customer
prisma.customer.create({
  data: {
    organizationId,
    phone,
    firstName,
    lastName,
    email
  }
})
```

#### Service: `dashboard.service.ts` - New Guests Metrics
**Files:**
- `backend/api/services/dashboard.service.ts`
- `api/services/dashboard.service.ts`
- `frontend/api/services/dashboard.service.ts`

**Operations:**
```typescript
// count - today's new guests
prisma.customer.count({
  where: {
    organizationId,
    createdAt: { gte: todayStart, lte: todayEnd },
    deletedAt: null
  }
})

// count - yesterday's new guests (for comparison)
prisma.customer.count({
  where: {
    organizationId,
    createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
    deletedAt: null
  }
})
```

---

## 4. API ENDPOINTS (MIGRATION TARGETS)

### GET /api/crm/customers
**Purpose:** Fetch customers for CRM dashboard  
**Query Parameters:**
- `branchId` (required)
- `search` (optional)
- `tier` (optional, not used in code)

**Request:** None  
**Response Type:** `CRMCustomersResponse`

```typescript
interface Customer {
  id: string
  name: string (combined firstName + lastName OR phone)
  phone: string
  email: string
  totalSpent: number
  visits: number (visitCount)
  lastVisit: string | null (lastVisitAt as ISO string)
  tier: 'gold' | 'silver' | 'bronze'
  loyaltyPoints: number
  preferences: string[]
  notes: string
}

interface CRMCustomersResponse {
  success: boolean
  data: Customer[]
  meta: {
    total: number
    tiers: {
      gold: number
      silver: number
      bronze: number
    }
  }
}
```

**HTTP Status Codes:**
- `200` OK - Success
- `400` Bad Request - Missing branchId
- `500` Internal Server Error

**Tenant Isolation:** organizationId + restaurantId  
**Authentication:** Mock auth context (TODO: JWT)

---

### GET /api/pos/customers/search
**Purpose:** Quick customer search in POS  
**Query Parameters:**
- `query` (required, minimum 1 character)

**Request:** None  
**Response Type:**

```typescript
interface Customer {
  id: string
  phone: string
  firstName: string | null
  lastName: string | null
  email: string | null
}

interface SearchResponse {
  success: boolean
  data: Customer[]
  meta: { total: number }
}
```

**HTTP Status Codes:**
- `200` OK - Success (empty array if no query or no matches)
- `500` Internal Server Error

**Tenant Isolation:** organizationId  
**Authentication:** Mock auth context  
**Business Logic:** Returns up to 10 results

---

### POST /api/pos/customers
**Purpose:** Create quick customer from POS or fetch existing  
**Query Parameters:** None

**Request Body:**
```typescript
{
  phone: string (required)
  firstName?: string
  lastName?: string
  email?: string
}
```

**Response Type:**
```typescript
{
  success: boolean
  data: {
    id: string
    phone: string
    firstName: string | null
    lastName: string | null
    email: string | null
  }
}
```

**HTTP Status Codes:**
- `200` OK - Customer already exists
- `201` Created - New customer created
- `400` Bad Request - Missing phone
- `500` Internal Server Error

**Tenant Isolation:** organizationId  
**Authentication:** Mock auth context  
**Business Logic:** Deduplication by (organizationId, phone)

---

## 5. FRONTEND HOOKS (DATA CONSUMPTION)

### useCRMCustomers Hook
**File:** `frontend/hooks/useCRMCustomers.ts`  
**Endpoint:** `/api/crm/customers?branchId={branchId}`

```typescript
export function useCRMCustomers(branchId: string | null): UseCRMCustomersReturn {
  // Fetches and returns customer data
  // Triggers refetch on branchId change
}
```

### useCustomerSearch Hook
**File:** `frontend/hooks/usePOS.ts` (lines 147-163)  
**Endpoint:** `/api/pos/customers/search?query={query}`

```typescript
export function useCustomerSearch(): UseCustomerSearchReturn {
  // Search function for real-time customer lookup
  // Used in POS for quick customer selection
}
```

---

## 6. FRONTEND PAGES & COMPONENTS

### CRM Page
**File:** `frontend/app/(dashboard)/crm/page.tsx`  
**Component:** Renders CRMView

### CRM Component
**File:** `frontend/components/crm/crm-view.tsx`  
**Features:**
- Search bar (name, phone, email)
- Customer table with tier badges
- Stats cards (total revenue, avg spent, etc.)
- Mock data (6 sample customers)
- Tier breakdown: Platinum, Gold, Silver, Bronze

### Related Components Using Customer Data
- `components/dashboard/dashboard-overview.tsx` - Shows newCustomers stat
- `components/billing/billing-view.tsx` - Shows customer names on invoices
- `components/analytics/analytics-view.tsx` - Shows repeat customer metrics

---

## 7. SERVICE LAYER

### dashboard.service.ts
**Purpose:** Calculate dashboard metrics  
**Customer Operations:**
- Count new guests (today vs. yesterday)
- Calculate change percentage
- TODO: Satisfaction rating (not yet implemented)

---

## 8. MIDDLEWARE & TENANT CONTEXT

### Auth Middleware
- `getMockAuthContext()` - Returns mock user with org/restaurant/branch IDs
- `extractTenantContext(authContext)` - Extracts tenant context

### Tenant Isolation
- **Root Level:** organizationId (all customer queries filtered)
- **Restaurant Level:** restaurantId (for multi-restaurant support)
- **Branch Level:** Not directly filtered in current code (TODO: verification)

---

## 9. VALIDATION REQUIREMENTS

### Current Validation
- `phone` - Required for POST /api/pos/customers
- `branchId` - Required for GET /api/crm/customers
- `query` - Validated for minimum length in GET /api/pos/customers/search

### Business Validation
- **Deduplication:** Unique (organizationId, phone) constraint
- **Status:** "active" | "inactive" | "blocked"
- **Search:** Case-insensitive on name, email; exact on phone

### TODO: Validation Schemas
- Zod schema for customer creation
- Zod schema for customer update
- Zod schema for address creation
- Zod schema for note creation

---

## 10. ERROR HANDLING

### Error Types Used
- `ValidationError` - Custom error class
- Prisma exceptions (implicit)

### Error Codes
- `CUSTOMER_CREATE_ERROR`
- `CUSTOMER_SEARCH_ERROR`
- `CRM_ERROR`

### HTTP Status Mappings
- `400` - ValidationError (missing required fields)
- `500` - Unexpected errors

---

## 11. RELATIONSHIPS & DEPENDENCIES

### Inbound References (Other modules use Customer)
- **Orders Module** - customerId (optional) on Order
- **Bills Module** - customerId (optional) on Bill
- **Payments Module** - customerId (optional) on Payment
- **Reservations Module** - customerId on Reservation
- **Dashboard Service** - Customer.createdAt for metrics

### Outbound References (Customer depends on)
- **Organization Module** - organizationId (FK, CASCADE delete)
- **User Module** - createdBy on CustomerNote (FK, SET NULL)

### Cross-Module Concerns
- Orders, Bills, Payments: READ customerId, lookup customer details
- Dashboard: READ customer counts by date
- CRM: Full CRUD on customer data

---

## 12. FIRESTORE REFERENCES

### Existing Helper Functions
```typescript
// backend/src/config/references.ts
customerRef(customerId: string) // Get customer doc reference
getCustomer(customerId: string) // Fetch customer document
documentExists(collection, id) // Check existence
```

---

## 13. DUPLICATE IMPLEMENTATIONS

### Code Duplication (Same endpoints in 3 locations)
1. `backend/app/api/*` - Backend implementation
2. `app/api/*` - Alias or duplicate
3. `frontend/app/api/*` - Frontend-side API routes

**Note:** Structure suggests routing ambiguity. Clarification needed post-migration on canonical endpoints.

---

## 14. SCOPE BOUNDARIES

### INCLUDED (Customer Module)
✓ Customer entity and its 3 subcollections  
✓ Customer CRUD operations  
✓ Customer search and lookup  
✓ Loyalty points tracking  
✓ Customer addresses  
✓ Customer notes  
✓ CRM dashboard pages  
✓ POS customer integration  
✓ Customer references in Orders/Bills/Payments  

### EXCLUDED (Other Modules - DO NOT TOUCH)
✗ Order Module - Separate migration (Phase 6.2.x)  
✗ Bill Module - Separate migration  
✗ Payment Module - Separate migration  
✗ Reservation Module - Separate migration  
✗ Dashboard Service - Keep customer metrics calls intact  
✗ Authentication - Keep auth middleware as-is  
✗ Organization/Restaurant/Branch - Already migrated  

---

## 15. REPOSITORIES REQUIRED

### To Create
1. **CustomerRepository** - Main customer CRUD
2. **CustomerAddressRepository** - Subcollection operations
3. **CustomerNoteRepository** - Subcollection operations
4. **CustomerLoyaltyPointsRepository** - 1:1 relationship operations

### Not Needed
- Services (migrate business logic directly to services)
- Controllers (endpoints are in routes)
- Validators (inline validation in routes for now)

---

## 16. CONFIGURATION CHECKLIST

### Collections ✓ Already Defined
- `COLLECTIONS.customers`
- `SUBCOLLECTION_PATHS.customerAddresses(customerId)`
- `SUBCOLLECTION_PATHS.customerNotes(customerId)`
- `SUBCOLLECTION_PATHS.customerLoyaltyPoints(customerId)`

### Types ✓ Base Types Available
- `BaseDocument` - Has all audit fields and soft delete
- `RestaurantScopedDocument` - Includes restaurantId (appropriate for customers)

### Firestore ✓ Initialized
- Firebase Admin SDK configured
- Converters available
- Query builders available

### To Create
- Customer Firestore document types (interfaces)
- Repository classes
- Factory registrations
- Export declarations

---

## 17. PERFORMANCE CONSIDERATIONS

### Current N+1 Issues
- CRM endpoint includes `loyaltyPoints` and `addresses` - Multiple queries
- Dashboard counts executed separately (can be optimized)

### Optimization Opportunities
- Batch loyalty points + addresses fetch
- Use collection group queries for addresses/notes if needed
- Implement Firestore indexes for searches (phone, email)
- Consider denormalizing total counts

### Firestore Indexes Needed
```
Collection: customers
├─ organizationId ASC, deletedAt ASC
├─ organizationId ASC, createdAt DESC
├─ organizationId ASC, phone ASC
├─ organizationId ASC, email ASC
└─ organizationId ASC, firstName ASC, lastName ASC (for search)
```

---

## 18. COMPLETION CHECKLIST

### Phase 6.2.8 Deliverables
- [ ] Define Customer Firestore document types
- [ ] Create CustomerRepository
- [ ] Create CustomerAddressRepository
- [ ] Create CustomerNoteRepository
- [ ] Create CustomerLoyaltyPointsRepository
- [ ] Register repositories in RepositoryFactory
- [ ] Update repository exports
- [ ] Migrate CRM customers endpoint
- [ ] Migrate POS customer search endpoint
- [ ] Migrate POS customer create endpoint
- [ ] Update dashboard.service.ts customer metrics
- [ ] Update all customer-related imports
- [ ] Remove Prisma customer client instantiations
- [ ] Verify ZERO Prisma customer references remain
- [ ] Compile without errors
- [ ] Test API contract preservation
- [ ] Verify tenant isolation
- [ ] Performance verification

---

## 19. RISK ASSESSMENT

### High Risk
- Tenant isolation must be preserved (organizationId scoping)
- Search functionality depends on proper Firestore indexing
- Deduplication logic for phone number (unique per org)

### Medium Risk
- Subcollection queries efficiency (multiple round trips)
- Loyalty points 1:1 relationship handling

### Low Risk
- Audit fields (already handled by BaseRepository)
- Soft delete (already handled by BaseRepository)
- Mock auth context (no changes needed)

---

## 20. NEXT STEPS

1. **Create Firestore Document Types** - Define Customer, CustomerAddress, CustomerNote, CustomerLoyaltyPoints interfaces
2. **Create Repositories** - Implement 4 repository classes extending BaseRepository
3. **Register Repositories** - Add to RepositoryFactory and exports
4. **Migrate Routes** - Replace Prisma calls with repository methods
5. **Update Services** - Replace Prisma calls in dashboard.service.ts
6. **Testing** - Verify API contracts, tenant isolation, and performance
7. **Cleanup** - Remove all Prisma customer references
8. **Verification** - Compile check, type check, runtime validation

---

**Report Status:** ✓ DISCOVERY COMPLETE - READY FOR MIGRATION  
**Recommendation:** Proceed to implementation phase with repositories and migrations.
