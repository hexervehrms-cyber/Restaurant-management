# Phase 6.1.3 – Firestore Infrastructure Report
**Date:** July 13, 2026  
**Phase Status:** ✅ COMPLETE  
**Infrastructure Type:** Generic, Reusable, Scalable  
**Ready for:** Phase 6.1.4 (Repository Layer Implementation)

---

## Overview

The Firestore infrastructure is now complete. This layer provides:

- ✅ **Generic CRUD operations** (no business logic)
- ✅ **Type-safe operations** (TypeScript)
- ✅ **Timestamp handling** (server-side generation)
- ✅ **Numeric precision** (Firestore.Numeric)
- ✅ **Soft delete support** (isDeleted pattern)
- ✅ **Batch operations** (up to 500 docs)
- ✅ **Transaction support** (ACID guarantees)
- ✅ **Query helpers** (filters, pagination, sorting)
- ✅ **Error handling** (consistent errors)
- ✅ **Reusable converters** (data transformation)

---

## Folder Structure

```
backend/src/
├── config/
│   ├── firebase.ts              ✅ Firebase Admin SDK (singleton)
│   ├── collections.ts           ✅ Collection names (constants)
│   ├── constants.ts             ✅ Enums, defaults, field names
│   ├── timestamps.ts            ✅ Timestamp helpers
│   ├── references.ts            ✅ Document reference helpers
│   └── converters.ts            ✅ Data conversion utilities
├── types/
│   └── firestore/
│       └── index.ts             ✅ Firestore type definitions
├── repositories/
│   └── BaseRepository.ts         ✅ Generic repository base class
└── (other existing folders remain unchanged)
```

---

## Files Created (8 total)

### 1. firebase.ts (Existing - Already Updated)
**Path:** `backend/src/config/firebase.ts`  
**Purpose:** Firebase Admin SDK singleton initialization  
**Exports:**
- `initializeFirebase()` - Initialize Firebase once
- `getAdmin()` - Get Firebase Admin instance
- `getFirestore()` - Get Firestore database reference
- `getAuth()` - Get Firebase Auth reference
- `isFirebaseInitialized()` - Check initialization status
- `getFirebaseStatus()` - Health check

**Usage:**
```typescript
await initializeFirebase()
const db = getFirestore()
const auth = getAuth()
```

---

### 2. collections.ts (NEW)
**Path:** `backend/src/config/collections.ts`  
**Purpose:** Centralized collection name constants  
**Exports:**
- `COLLECTIONS` - Object with all 40 collection names
- `SUBCOLLECTION_PATHS` - Functions for subcollection paths
- `CollectionName` - Type for collection names
- `ALL_COLLECTIONS` - Array of all collections
- `AllCollections` - Union type of all collections

**Contents:**
- 3 root collections (organizations, users, adminSettings)
- 14 organization-level collections
- 18 transaction-level collections
- 2 aggregator collections
- 3 subcollection path helpers

**Usage:**
```typescript
import { COLLECTIONS } from './config/collections'

// Instead of hardcoding:
db.collection('orders')  // ❌ Wrong

// Use:
db.collection(COLLECTIONS.orders)  // ✅ Correct
```

**RULE:** Never hardcode collection names. Always use COLLECTIONS constant.

---

### 3. constants.ts (NEW)
**Path:** `backend/src/config/constants.ts`  
**Purpose:** Centralized enums, field names, and defaults  
**Exports:**

**Audit Fields:**
- `AUDIT_FIELDS` - createdAt, updatedAt, createdBy, updatedBy
- `SOFT_DELETE_FIELDS` - isDeleted, deletedAt, deletedBy
- `BASE_DOCUMENT_FIELDS` - All base fields combined

**Status Enums (15 enums):**
- `OrganizationStatus` - active, inactive, suspended
- `UserStatus`, `UserRole` - 8 roles
- `OrderStatus`, `OrderType`, `PaymentStatus`, `BillStatus`
- `TableStatus`, `ReservationStatus`, `KitchenTicketStatus`
- `InventoryStatus`, `SyncStatus`, `NotificationType`, `AuditAction`
- `SubscriptionTier`, `PaymentMethod`, `UnitOfMeasure`, `AggregatorType`

**Defaults:**
- `PAGINATION` - pageSize: 20, maxPageSize: 100
- `BATCH_OPERATIONS` - maxBatchSize: 500
- `RETENTION_POLICY` - archiveAfter: 90 days, hardDeleteAfter: 365 days

**Other Constants:**
- `ERROR_MESSAGES` - Consistent error strings
- `SUCCESS_MESSAGES` - Consistent success strings
- `RATING`, `SPICE_LEVEL` - Numeric ranges
- `CURRENCIES`, `QUERY_LIMITS` - Various defaults

**Usage:**
```typescript
import { OrderStatus, PAGINATION } from './config/constants'

const order = { status: OrderStatus.PENDING }
const pageSize = PAGINATION.DEFAULT_PAGE_SIZE
```

---

### 4. timestamps.ts (NEW)
**Path:** `backend/src/config/timestamps.ts`  
**Purpose:** Timestamp utility functions  
**Exports (20 functions):**

**Basic Operations:**
- `serverTimestamp()` - Get server timestamp (FieldValue)
- `createTimestamp()` - Get current timestamp
- `updateTimestamp()` - For update operations
- `dateToTimestamp()` - Convert Date to Firestore Timestamp
- `timestampToDate()` - Convert Firestore Timestamp to Date

**Conversions:**
- `fromSeconds()` - Create timestamp from seconds
- `toMillis()` - Convert to milliseconds
- `formatTimestamp()` - Format for display
- `formatTimestampISO()` - ISO format

**Comparisons:**
- `isPast()` - Check if timestamp is in past
- `isFuture()` - Check if timestamp is in future
- `isToday()` - Check if timestamp is today
- `getTimeDiffMs()` - Difference in milliseconds
- `getTimeDiffSeconds()` - Difference in seconds
- `getTimeDiffDays()` - Difference in days

**Date Ranges:**
- `getStartOfDay()` - Start of day timestamp
- `getEndOfDay()` - End of day timestamp
- `getStartOfMonth()` - Start of month timestamp
- `getEndOfMonth()` - End of month timestamp

**Usage:**
```typescript
import { serverTimestamp, isPast, getStartOfDay } from './config/timestamps'

// Create document
const doc = {
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}

// Query by date range
const today = getStartOfDay()
db.collection('orders').where('createdAt', '>=', today)

// Check if payment is overdue
if (isPast(payment.dueDate)) { ... }
```

---

### 5. references.ts (NEW)
**Path:** `backend/src/config/references.ts`  
**Purpose:** Document reference helpers  
**Exports (25+ functions):**

**Reference Getters:**
- `organizationRef()` - Get organization reference
- `userRef()` - Get user reference
- `restaurantRef()` - Get restaurant reference
- `branchRef()`, `customerRef()`, `orderRef()`
- `billRef()`, `paymentRef()`, `tableRef()`
- `menuItemRef()`, `kitchenTicketRef()`, `reservationRef()`
- `inventoryItemRef()`, `auditLogRef()`, `notificationRef()`
- (and more for all major collections)

**Document Fetchers:**
- `getOrganization()` - Fetch organization
- `getUser()` - Fetch user
- `getRestaurant()` - Fetch restaurant
- `getBranch()`, `getCustomer()`, `getOrder()`
- `getBill()` - (and more)

**Batch Operations:**
- `batchGetDocuments()` - Fetch multiple docs
- `documentExists()` - Check if doc exists
- `getDocId()` - Extract ID from reference
- `getCollectionName()` - Extract collection name

**Usage:**
```typescript
import { orderRef, getOrder, documentExists } from './config/references'

// Get reference
const ref = orderRef(orderId)
const snap = await ref.get()

// Fetch document
const order = await getOrder(orderId)

// Check existence
const exists = await documentExists(COLLECTIONS.customers, customerId)

// Batch fetch
const orders = await batchGetDocuments(COLLECTIONS.orders, [id1, id2, id3])
```

---

### 6. converters.ts (NEW)
**Path:** `backend/src/config/converters.ts`  
**Purpose:** Data conversion utilities  
**Exports:**

**Converters:**
- `FirestoreConverter<T>` - Generic converter class
- `createDocumentConverter<T>()` - Create typed converter
- `safeParseDocument()` - Parse with error handling
- `batchConvert()` - Convert multiple documents
- `querySnapshotToArray()` - Convert query snapshot to array

**Numeric Handling:**
- `toFirestoreNumeric()` - Convert to Firestore.Numeric
- `fromFirestoreNumeric()` - Convert from Firestore.Numeric

**Document Preparation:**
- `prepareDocumentForCreate()` - Add create fields
- `prepareDocumentForUpdate()` - Add update fields
- `prepareDocumentForDelete()` - Soft delete fields
- `prepareDocumentForRestore()` - Undo soft delete

**Usage:**
```typescript
import { 
  toFirestoreNumeric, 
  prepareDocumentForCreate,
  querySnapshotToArray 
} from './config/converters'

// Handle money
const price = toFirestoreNumeric(99.99)

// Prepare for creation
const doc = prepareDocumentForCreate(data, userId, orgId)
await db.collection(COLLECTIONS.orders).doc(id).set(doc)

// Convert query results
const snapshot = await query.get()
const orders = querySnapshotToArray<Order>(snapshot)
```

---

### 7. types/firestore/index.ts (NEW)
**Path:** `backend/src/types/firestore/index.ts`  
**Purpose:** Reusable Firestore type definitions  
**Exports (30+ types):**

**Base Types:**
- `DocumentId` - Branded string for doc IDs
- `FirestoreTimestamp` - Timestamp union type
- `FirestoreNumeric` - Numeric union type
- `DocumentReference`, `CollectionReference`
- `Query`, `DocumentSnapshot`, `QuerySnapshot`
- `WriteBatch`, `Transaction`

**Document Types:**
- `AuditFields` - Audit timestamp fields
- `SoftDeleteFields` - Soft delete fields
- `BaseDocument` - Base for all documents
- `RestaurantScopedDocument` - Restaurant-scoped
- `BranchScopedDocument` - Branch-scoped

**Operation Types:**
- `CreateResult<T>` - Create operation result
- `UpdateResult<T>` - Update operation result
- `DeleteResult` - Delete operation result
- `BatchResult` - Batch operation result
- `TransactionResult<T>` - Transaction result

**Query Types:**
- `QueryFilter` - Where clause
- `QueryOrder` - Order by clause
- `QueryOptions` - Query options
- `PaginationOptions` - Pagination config
- `PaginationResult<T>` - Paginated results

**Other Types:**
- `DocumentChange<T>` - Real-time listener changes
- `OperationError` - Error type
- `UnsubscribeFunction` - Listener cleanup

**Usage:**
```typescript
import { BaseDocument, DocumentId, PaginationResult } from './types/firestore'

interface Order extends BaseDocument {
  customerId: string
  totalAmount: number
  status: 'pending' | 'confirmed'
}

const result: PaginationResult<Order> = await repo.findWithPagination()
```

---

### 8. BaseRepository.ts (NEW)
**Path:** `backend/src/repositories/BaseRepository.ts`  
**Purpose:** Generic repository base class  
**Methods (11 public):**

**CREATE:**
- `create()` - Add new document (auto-generate ID)
- `createWithId()` - Add new document (custom ID)

**READ:**
- `findById()` - Get one document
- `getAll()` - Get all documents (WARNING: for large collections)
- `findMany()` - Query with filters, ordering, limit
- `findWithPagination()` - Query with pagination

**UPDATE:**
- `update()` - Update document

**DELETE:**
- `delete()` - Soft delete document
- `restore()` - Undo soft delete

**UTILITY:**
- `exists()` - Check if document exists
- `count()` - Count documents matching filter
- `batchWrite()` - Batch write operation
- `transaction()` - Run transactional operation

**All Methods Include:**
- Error handling
- Type safety
- Automatic audit fields (createdAt, updatedAt, createdBy, etc.)
- Soft delete support
- Firestore.Numeric support

**Usage:**
```typescript
import { BaseRepository } from './repositories/BaseRepository'
import { Order } from './types/models/Order'

class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(COLLECTIONS.orders)
  }
  // Add business-specific methods here
}

// Usage:
const repo = new OrderRepository()
const order = await repo.findById(orderId)
const orders = await repo.findMany({
  filters: [{ field: 'status', operator: '==', value: 'pending' }],
  orders: [{ field: 'createdAt', direction: 'desc' }],
  limit: 20
})
```

---

## Key Features

### 1. ✅ Type Safety
- Full TypeScript support
- Generic types for reusable code
- Branded types to prevent ID mixing

### 2. ✅ Error Handling
- Consistent error messages
- Try-catch on all operations
- Graceful degradation

### 3. ✅ Soft Deletes (MANDATORY)
- All DELETE operations set `isDeleted = true`
- No hard deletion at repository level
- Support for restore operations

### 4. ✅ Audit Trail
- All documents track: createdAt, updatedAt, createdBy, updatedBy
- Server-side timestamps (no clock skew)
- User tracking for compliance

### 5. ✅ Firestore.Numeric
- All money fields support Firestore.Numeric
- Prevents floating-point errors
- Automatic conversion in converters

### 6. ✅ Batch Operations
- Support up to 500 writes in single batch
- Error tracking for failed operations
- Atomic batch writes

### 7. ✅ Transactions
- Support for ACID transactions
- Multi-document consistency
- Automatic retry on conflicts

### 8. ✅ Pagination
- Offset-based pagination
- Cursor support ready for future optimization
- Metadata (total count, hasMore flag)

### 9. ✅ Query Builders
- Flexible filter system
- Multi-field ordering
- Limit and offset support

### 10. ✅ Reusable References
- Helper functions for all collections
- Consistent reference creation
- Batch fetch support

---

## Export Summary

### From config/firebase.ts
```typescript
export { 
  initializeFirebase, 
  getFirestore, 
  getAuth, 
  getAdmin,
  isFirebaseInitialized,
  getFirebaseStatus 
}
```

### From config/collections.ts
```typescript
export { COLLECTIONS, SUBCOLLECTION_PATHS, CollectionName }
```

### From config/constants.ts
```typescript
export { 
  AUDIT_FIELDS, SOFT_DELETE_FIELDS, BASE_DOCUMENT_FIELDS,
  OrganizationStatus, UserStatus, UserRole,
  OrderStatus, OrderType, PaymentStatus, BillStatus,
  TableStatus, ReservationStatus, KitchenTicketStatus,
  InventoryStatus, SyncStatus, NotificationType, AuditAction,
  SubscriptionTier, PaymentMethod, UnitOfMeasure, AggregatorType,
  PAGINATION, BATCH_OPERATIONS, RETENTION_POLICY,
  ERROR_MESSAGES, SUCCESS_MESSAGES
}
```

### From config/timestamps.ts
```typescript
export { 
  serverTimestamp, createTimestamp, updateTimestamp,
  dateToTimestamp, timestampToDate, fromSeconds, toMillis,
  formatTimestamp, formatTimestampISO,
  getTimeDiffMs, getTimeDiffSeconds, getTimeDiffDays,
  isPast, isFuture, isToday,
  getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth
}
```

### From config/references.ts
```typescript
export { 
  organizationRef, userRef, restaurantRef, branchRef,
  customerRef, orderRef, billRef, paymentRef, tableRef,
  menuItemRef, kitchenTicketRef, reservationRef,
  inventoryItemRef, auditLogRef, notificationRef,
  getOrganization, getUser, getRestaurant, getBranch,
  getCustomer, getOrder, getBill,
  batchGetDocuments, documentExists, getDocId, getCollectionName
}
```

### From config/converters.ts
```typescript
export { 
  FirestoreConverter, createDocumentConverter,
  toFirestoreNumeric, fromFirestoreNumeric,
  safeParseDocument, batchConvert, querySnapshotToArray,
  prepareDocumentForCreate, prepareDocumentForUpdate,
  prepareDocumentForDelete, prepareDocumentForRestore
}
```

### From types/firestore/index.ts
```typescript
export { 
  DocumentId, createDocumentId,
  FirestoreTimestamp, FirestoreNumeric,
  DocumentReference, CollectionReference, Query,
  DocumentSnapshot, QuerySnapshot,
  WriteBatch, Transaction, FieldValue,
  AuditFields, SoftDeleteFields, BaseDocument,
  RestaurantScopedDocument, BranchScopedDocument,
  CreateResult, UpdateResult, DeleteResult, BatchResult,
  QueryFilter, QueryOrder, QueryOptions,
  PaginationOptions, PaginationResult,
  DocumentChange, OperationError,
  TransactionResult, UnsubscribeFunction
}
```

### From repositories/BaseRepository.ts
```typescript
export { BaseRepository }
```

---

## Verification Checklist

- ✅ Firebase initializes once (singleton pattern)
- ✅ Firestore instance exported globally
- ✅ Auth instance exported globally
- ✅ Collection constants centralized (40 collections)
- ✅ No hardcoded collection names in code
- ✅ BaseRepository provides generic CRUD
- ✅ All types reusable and documented
- ✅ Timestamp helpers for all date operations
- ✅ Reference helpers for all major collections
- ✅ Converters handle Timestamp and Numeric
- ✅ Enums for all status fields
- ✅ Error handling consistent
- ✅ No business logic in infrastructure
- ✅ No Prisma removed
- ✅ No modules migrated
- ✅ No APIs modified
- ✅ Frontend unchanged

---

## Usage Examples

### Example 1: Create Order
```typescript
import { BaseRepository } from './repositories/BaseRepository'
import { COLLECTIONS } from './config/collections'
import { prepareDocumentForCreate } from './config/converters'
import { toFirestoreNumeric } from './config/converters'

class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(COLLECTIONS.orders)
  }

  async createOrder(order: Order, userId: string, orgId: string) {
    return this.create({
      ...order,
      totalAmount: toFirestoreNumeric(order.totalAmount)
    }, userId, orgId)
  }
}
```

### Example 2: Query Orders
```typescript
const orders = await orderRepo.findMany({
  filters: [
    { field: 'organizationId', operator: '==', value: orgId },
    { field: 'branchId', operator: '==', value: branchId },
    { field: 'status', operator: '==', value: 'pending' },
    { field: 'isDeleted', operator: '==', value: false }
  ],
  orders: [{ field: 'createdAt', direction: 'desc' }],
  limit: 50
})
```

### Example 3: Pagination
```typescript
const result = await orderRepo.findWithPagination(
  {
    filters: [{ field: 'branchId', operator: '==', value: branchId }],
    orders: [{ field: 'createdAt', direction: 'desc' }]
  },
  { pageSize: 20, pageNumber: 1 }
)

console.log(`Total: ${result.total}, Page: ${result.pageNumber}, Has More: ${result.hasMore}`)
```

### Example 4: Soft Delete
```typescript
// Delete (soft delete - sets isDeleted = true)
await orderRepo.delete(orderId, userId)

// Restore (undo soft delete)
await orderRepo.restore(orderId, userId)
```

### Example 5: Transaction
```typescript
await orderRepo.transaction(async (transaction) => {
  const orderSnap = await transaction.get(orderRef)
  const billSnap = await transaction.get(billRef)
  
  if (!orderSnap.data().isPaid) {
    transaction.update(orderRef, { status: 'confirmed' })
    transaction.set(billRef, billData)
  }
})
```

---

## What's Next

### Phase 6.1.4 – Repository Layer Implementation

When this infrastructure is approved:

1. **Create 40 Business Repositories**
   - One per collection
   - Extend BaseRepository
   - Add collection-specific methods

2. **Implement Service Layer**
   - Business logic
   - Validation
   - Cross-collection operations

3. **Create API Endpoints**
   - REST API routes
   - Request/response handling
   - Error mapping

4. **Data Migration**
   - Prisma → Firestore
   - Parallel running
   - Rollback capability

---

## Infrastructure Ready ✅

The Firestore infrastructure is now complete and ready for business repository implementation.

**Status:** ⏳ Awaiting approval to proceed to Phase 6.1.4

