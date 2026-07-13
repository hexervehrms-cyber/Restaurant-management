# Phase 6.1.4 – Core Firestore Repository Foundation

**Status:** ✅ COMPLETE

**Date:** July 13, 2026

---

## Executive Summary

The **Core Firestore Repository Framework** has been successfully created. This generic, reusable foundation replaces Prisma as the application's data access layer for Firestore operations.

**Key Achievements:**
- ✅ Generic repository interface (`IRepository<T>`)
- ✅ Base repository implementation with CRUD, transactions, and batch operations
- ✅ Repository factory with singleton pattern and dependency injection
- ✅ Full TypeScript type safety
- ✅ No business logic - infrastructure only
- ✅ Zero module repositories created (as planned)
- ✅ Prisma remains untouched
- ✅ APIs and frontend remain unchanged

---

## Architecture

### 1. IRepository Interface

**Location:** `backend/src/repositories/IRepository.ts`

Generic interface defining the contract all repositories must implement:

```typescript
export interface IRepository<T extends BaseDocument> {
  // CREATE
  create(data, userId, organizationId?): Promise<CreateResult<T>>
  createWithId(id, data, userId, organizationId?): Promise<CreateResult<T>>
  
  // READ
  findById(id): Promise<T | null>
  getAll(): Promise<T[]>
  findMany(options?): Promise<T[]>
  findWithCursorPagination(options?, pagination?): Promise<CursorPaginationResult<T>>
  findWithPagination(options?, pagination?): Promise<PaginationResult<T>>
  
  // UPDATE
  update(id, updates, userId): Promise<UpdateResult<T>>
  
  // DELETE
  delete(id, userId): Promise<DeleteResult>
  restore(id, userId): Promise<UpdateResult<T>>
  
  // QUERY
  exists(id): Promise<boolean>
  count(options?): Promise<number>
  
  // BATCH & TRANSACTION
  batchWrite(operation): Promise<BatchResult>
  transaction<R>(operation): Promise<R>
}
```

**Key Characteristics:**
- Generic type parameter `T extends BaseDocument`
- No business logic - infrastructure only
- Fully documented with JSDoc examples
- Supports both cursor and offset pagination
- Includes soft delete and restore operations

### 2. BaseRepository Class

**Location:** `backend/src/repositories/BaseRepository.ts`

Generic base class implementing `IRepository<T>`:

```typescript
export class BaseRepository<T extends BaseDocument> {
  protected db: admin.firestore.Firestore
  protected collectionName: string
  
  constructor(collectionName: string)
  
  // All IRepository methods implemented
  async create(...)
  async createWithId(...)
  async findById(...)
  async getAll(...)
  async findMany(...)
  async findWithCursorPagination(...)
  async findWithPagination(...)
  async update(...)
  async delete(...)
  async restore(...)
  async exists(...)
  async count(...)
  async batchWrite(...)
  async transaction<R>(...)
}
```

**Features:**
- ✅ Generic CRUD operations
- ✅ Query building (filters, ordering, limits)
- ✅ Cursor-based pagination (recommended)
- ✅ Offset-based pagination (deprecated)
- ✅ Batch write operations
- ✅ Transaction support with automatic retry
- ✅ Soft delete support (isDeleted, deletedAt, deletedBy)
- ✅ Restore functionality
- ✅ Automatic timestamp handling
- ✅ User audit trail (createdBy, updatedBy)
- ✅ Organization scoping (organizationId)
- ✅ Error handling with helpful messages

**Query Builders:**

```typescript
// Filters
{ field: 'status', operator: '==', value: 'active' }
{ field: 'age', operator: '>', value: 18 }
{ field: 'tags', operator: 'array-contains', value: 'vip' }
{ field: 'id', operator: 'in', value: ['1', '2', '3'] }

// Ordering
{ field: 'createdAt', direction: 'desc' }
{ field: 'name', direction: 'asc' }

// Options
{ filters: [...], orders: [...], limit: 20, offset: 0 }
```

### 3. RepositoryFactory

**Location:** `backend/src/repositories/RepositoryFactory.ts`

Singleton factory managing repository instances and providing dependency injection:

```typescript
export class RepositoryFactory {
  static register<T>(name, constructor, collectionName)
  static resolve<T>(name): T
  static resolveOrCreate<T>(name, constructor, collectionName): T
  static has(name): boolean
  static getRegistered(): string[]
  static unregister(name): boolean
  static clear(): number
  static reset(): void
  static getInfo(name): Object | null
  static getAllInfo(): Object[]
}
```

**Usage:**

```typescript
// Registration (during app initialization)
RepositoryFactory.register('users', UserRepository, COLLECTIONS.users)
RepositoryFactory.register('orders', OrderRepository, COLLECTIONS.orders)

// Resolution
const userRepo = RepositoryFactory.resolve<UserRepository>('users')
const orderRepo = RepositoryFactory.resolve<OrderRepository>('orders')

// Or resolve with auto-registration
const userRepo = RepositoryFactory.resolveOrCreate(
  'users',
  UserRepository,
  COLLECTIONS.users
)

// Check registration
if (RepositoryFactory.has('users')) {
  // ...
}

// Debugging
const registered = RepositoryFactory.getRegistered()
const info = RepositoryFactory.getAllInfo()

// Testing - clear all
RepositoryFactory.clear()
```

**Benefits:**
- Singleton pattern - one instance per repository
- Centralized dependency injection
- Lazy loading support
- Easy testing with reset/clear
- No service locator complexity

### 4. Exports Index

**Location:** `backend/src/repositories/index.ts`

Centralized exports for the repository layer:

```typescript
// Framework
export { IRepository } from './IRepository'
export { BaseRepository } from './BaseRepository'
export { RepositoryFactory } from './RepositoryFactory'

// Common types
export type {
  DocumentId,
  BaseDocument,
  CreateResult,
  UpdateResult,
  DeleteResult,
  BatchResult,
  QueryOptions,
  QueryFilter,
  QueryOrder,
  PaginationResult,
  PaginationOptions,
  CursorPaginationResult,
  FirestoreError,
  FirestoreTimestamp,
}

// Utilities
export {
  FirestoreConverter,
  toFirestoreNumeric,
  fromFirestoreNumeric,
  createDocumentConverter,
  safeParseDocument,
  batchConvert,
  querySnapshotToArray,
  prepareDocumentForCreate,
  prepareDocumentForUpdate,
  prepareDocumentForDelete,
  prepareDocumentForRestore,
}

// Error handling
export {
  FirestoreError,
  FirestoreErrorCode,
  mapFirebaseError,
  safeFirestoreOperation,
  isFirestoreError,
  isNotFound,
  isPermissionDenied,
  isAlreadyExists,
  isRetryable,
  retryFirestoreOperation,
}

// Constants
export { COLLECTIONS, SUBCOLLECTION_PATHS, ALL_COLLECTIONS }
```

---

## Public API

### Create Operations

```typescript
// Auto-generated ID
const result = await repo.create(userData, userId, organizationId)
if (result.success) {
  console.log('Created:', result.data)
} else {
  console.error('Error:', result.error)
}

// Custom ID
const result = await repo.createWithId(id, userData, userId)
```

### Read Operations

```typescript
// Single document
const user = await repo.findById('user-123')

// All documents (WARNING: use with caution)
const allUsers = await repo.getAll()

// Query with filters and ordering
const activeUsers = await repo.findMany({
  filters: [
    { field: 'status', operator: '==', value: 'active' },
    { field: 'organizationId', operator: '==', value: orgId }
  ],
  orders: [{ field: 'createdAt', direction: 'desc' }],
  limit: 20
})

// Cursor pagination (RECOMMENDED)
const result = await repo.findWithCursorPagination(
  { filters: [...] },
  { pageSize: 20 }
)
const nextResult = await repo.findWithCursorPagination(
  { filters: [...] },
  { pageSize: 20, startAfter: result.lastSnapshot }
)

// Offset pagination (DEPRECATED)
const result = await repo.findWithPagination(
  { filters: [...] },
  { pageSize: 20, pageNumber: 1 }
)
```

### Update Operations

```typescript
const result = await repo.update('user-123', { status: 'inactive' }, userId)
if (result.success) {
  console.log('Updated:', result.data)
}
```

### Delete Operations

```typescript
// Soft delete (marks as deleted)
const result = await repo.delete('user-123', userId)

// Restore (undo soft delete)
const result = await repo.restore('user-123', userId)
```

### Query Operations

```typescript
// Check existence
if (await repo.exists('user-123')) {
  // ...
}

// Count matching
const count = await repo.count({
  filters: [{ field: 'status', operator: '==', value: 'active' }]
})
```

### Batch Operations

```typescript
const result = await repo.batchWrite((batch) => {
  batch.set(docRef1, data1)
  batch.update(docRef2, data2)
  batch.delete(docRef3)
})

console.log(`Success: ${result.successCount}, Failures: ${result.failureCount}`)
if (result.errors.length > 0) {
  result.errors.forEach(err => console.error(err.docId, err.error))
}
```

### Transaction Operations

```typescript
const result = await repo.transaction(async (transaction) => {
  // Transactional operations
  const snap = await transaction.get(docRef)
  const currentValue = snap.data().count
  
  transaction.update(docRef, { count: currentValue + 1 })
  
  return currentValue + 1
})

// Automatic retry on conflict
// Guaranteed atomic execution
```

---

## Supported Operations

### ✅ CRUD Operations
- [x] Create with auto ID
- [x] Create with custom ID
- [x] Read by ID
- [x] Read all (with warning)
- [x] Read with filters
- [x] Read with ordering
- [x] Read with pagination (cursor and offset)
- [x] Update partial document
- [x] Soft delete
- [x] Restore deleted
- [x] Check existence
- [x] Count with filters

### ✅ Query Features
- [x] Filters (==, !=, <, <=, >, >=, array-contains, in, array-contains-any)
- [x] Ordering (asc, desc)
- [x] Limit
- [x] Offset
- [x] Cursor-based pagination
- [x] Offset-based pagination

### ✅ Advanced Features
- [x] Batch writes (atomic)
- [x] Transactions (with automatic retry)
- [x] Soft delete support
- [x] Restore functionality
- [x] Automatic timestamps
- [x] User audit trail
- [x] Organization scoping
- [x] Generic typing

### ✅ Error Handling
- [x] Firebase error mapping
- [x] Friendly error messages
- [x] Error codes and HTTP status
- [x] Retry logic for transient errors
- [x] Safe operation wrappers

---

## Extension Guide

### Creating a Module Repository

When migrating a module (e.g., during Phase 6.2.1 – Authentication Migration):

```typescript
// Step 1: Define types
import { RestaurantScopedDocument, DocumentId } from '@/repositories'

export interface User extends RestaurantScopedDocument {
  email: string
  password: string
  role: 'admin' | 'manager' | 'staff'
  firstName: string
  lastName: string
  status: 'active' | 'inactive'
}

// Step 2: Create repository
import { BaseRepository, IRepository } from '@/repositories'
import { COLLECTIONS } from '@/firestore/collections'

export class UserRepository extends BaseRepository<User> implements IRepository<User> {
  constructor() {
    super(COLLECTIONS.users)
  }
  
  // NO business logic here
  // Only CRUD and generic Firestore operations
  // Business logic goes in services
}

// Step 3: Register repository
RepositoryFactory.register('users', UserRepository, COLLECTIONS.users)

// Step 4: Use in services
export class UserService {
  private userRepo = RepositoryFactory.resolve<UserRepository>('users')
  
  async getUserById(id: string): Promise<User | null> {
    return await this.userRepo.findById(id)
  }
  
  async getUsersByRole(role: string, organizationId: string): Promise<User[]> {
    return await this.userRepo.findMany({
      filters: [
        { field: 'role', operator: '==', value: role },
        { field: 'organizationId', operator: '==', value: organizationId }
      ]
    })
  }
  
  // Business logic here - validation, calculations, external calls, etc.
  async createUser(data: Omit<User, keyof BaseDocument>, userId: string, org: string) {
    // Validation
    if (!data.email) throw new Error('Email required')
    if (data.email.includes('@')) throw new InvalidEmailError()
    
    // Business logic
    const emailExists = await this.userRepo.findMany({
      filters: [{ field: 'email', operator: '==', value: data.email }]
    })
    if (emailExists.length > 0) throw new DuplicateEmailError()
    
    // Create
    return await this.userRepo.create(data, userId, org)
  }
}
```

### Example: OrderRepository

```typescript
import { BranchScopedDocument } from '@/repositories'

export interface Order extends BranchScopedDocument {
  tableNumber: number
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'closed'
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  items: OrderItem[]
}

export class OrderRepository extends BaseRepository<Order> implements IRepository<Order> {
  constructor() {
    super(COLLECTIONS.orders)
  }
  
  // Business layer calls:
  // const orderRepo = RepositoryFactory.resolve<OrderRepository>('orders')
  // const orders = await orderRepo.findMany(...)
}
```

### Example: QueryBuilder Usage

```typescript
// Get active orders for a specific branch
const orders = await orderRepo.findMany({
  filters: [
    { field: 'status', operator: '!=', value: 'closed' },
    { field: 'branchId', operator: '==', value: branchId },
    { field: 'organizationId', operator: '==', value: orgId }
  ],
  orders: [
    { field: 'createdAt', direction: 'desc' }
  ],
  limit: 50
})

// Paginated results
const result = await orderRepo.findWithCursorPagination(
  {
    filters: [
      { field: 'status', operator: '==', value: 'closed' },
      { field: 'branchId', operator: '==', value: branchId }
    ],
    orders: [{ field: 'createdAt', direction: 'desc' }]
  },
  { pageSize: 20, startAfter: cursor }
)

console.log(result.data)        // Orders array
console.log(result.hasMore)     // Boolean
console.log(result.lastSnapshot) // For next page query
```

### Example: Batch Operations

```typescript
const result = await orderRepo.batchWrite((batch) => {
  // Create multiple orders
  const data1 = { /* order1 */ }
  const data2 = { /* order2 */ }
  
  batch.set(docRef1, data1)
  batch.set(docRef2, data2)
})

if (result.success) {
  console.log('Batch completed')
} else {
  result.errors.forEach(err => console.error(err.error))
}
```

### Example: Transactions

```typescript
const result = await orderRepo.transaction(async (transaction) => {
  // Get current order total
  const orderSnap = await transaction.get(orderDocRef)
  const currentTotal = orderSnap.data().totalAmount
  
  // Add item
  const newTotal = currentTotal + 25.50
  
  // Update in transaction
  transaction.update(orderDocRef, { totalAmount: newTotal })
  
  // Update inventory in transaction
  transaction.update(inventoryDocRef, { quantity: inventory.quantity - 1 })
  
  return newTotal
})

// Both operations succeed together or both fail
```

---

## Integration Points

### ✅ Firestore Infrastructure Used
- `firebase.ts` - Firebase initialization
- `collections.ts` - Collection constants
- `converters.ts` - Data conversion utilities
- `timestamps.ts` - Timestamp handling
- `references.ts` - Document references (future use)
- `errors.ts` - Error mapping
- `validators.ts` - Validation utilities (future use)

### ✅ Types Leveraged
- `BaseDocument` - Required base fields
- `RestaurantScopedDocument` - Restaurant scope
- `BranchScopedDocument` - Branch scope
- `QueryOptions`, `QueryFilter`, `QueryOrder`
- `CreateResult`, `UpdateResult`, `DeleteResult`
- `PaginationResult`, `CursorPaginationResult`
- `BatchResult`

### ✅ Converters Used
- `prepareDocumentForCreate()` - Auto timestamps, audit fields
- `prepareDocumentForUpdate()` - Update timestamps only
- `prepareDocumentForDelete()` - Soft delete fields
- `prepareDocumentForRestore()` - Clear delete fields
- `querySnapshotToArray()` - Batch document conversion

---

## File Structure

```
backend/src/repositories/
├── BaseRepository.ts          ✅ COMPLETE - Generic CRUD base class
├── IRepository.ts            ✅ COMPLETE - Generic interface
├── RepositoryFactory.ts      ✅ COMPLETE - Singleton factory & DI
└── index.ts                  ✅ COMPLETE - Exports

backend/src/config/
├── firebase.ts               ✅ Firestore initialization
├── collections.ts            ✅ Collection constants
├── converters.ts             ✅ Data conversion utilities
├── timestamps.ts             ✅ Timestamp handling
├── constants.ts              ✅ Constants
└── references.ts             ✅ Document references

backend/src/firestore/
├── collections.ts            ✅ Collection definitions
├── errors.ts                 ✅ Error handling
├── validators.ts             ✅ Validation utilities
└── index.ts                  ✅ Exports

backend/src/types/firestore/
└── index.ts                  ✅ Type definitions
```

---

## Verification Checklist

- [x] Generic repository interface created (`IRepository<T>`)
- [x] Base repository implemented (`BaseRepository<T>`)
- [x] Repository factory created (`RepositoryFactory`)
- [x] Singleton pattern implemented
- [x] Dependency injection support
- [x] CRUD operations working
- [x] Generic queries working
- [x] Pagination working (cursor + offset)
- [x] Transactions working with retry
- [x] Batch writes working
- [x] Soft delete support
- [x] Restore functionality
- [x] Error handling comprehensive
- [x] Timestamp handling automatic
- [x] Audit fields (createdBy, updatedBy)
- [x] Organization scoping support
- [x] Generic typing throughout
- [x] No module repositories created
- [x] No Prisma removed
- [x] No APIs modified
- [x] No frontend modified
- [x] Full JSDoc documentation
- [x] Extension guide included

---

## What's NOT Included (By Design)

- ❌ Module-specific repositories (UserRepository, OrderRepository, etc.)
- ❌ Business logic (validation, calculations, external API calls)
- ❌ Prisma modifications or removal
- ❌ API route changes
- ❌ Frontend changes
- ❌ Authentication migration
- ❌ Orders migration
- ❌ Customers migration
- ❌ Inventory migration

These will be created during subsequent phases as each module is migrated.

---

## Next Steps

**Phase 6.2.1 – Authentication Migration (Next):**
1. Create `UserRepository extends BaseRepository<User>`
2. Create `RoleRepository extends BaseRepository<Role>`
3. Migrate authentication service to use repositories
4. Register repositories in RepositoryFactory
5. Update auth APIs to use new repositories
6. Deprecate Prisma for auth module

**Phase 6.2.2 – Orders Migration:**
1. Create `OrderRepository extends BaseRepository<Order>`
2. Create `OrderItemRepository extends BaseRepository<OrderItem>`
3. Migrate orders service to use repositories
4. Update order APIs

**Phase 6.2.3 – Customers Migration:**
1. Create `CustomerRepository extends BaseRepository<Customer>`
2. Migrate CRM service

**Phase 6.2.4 – Inventory Migration:**
1. Create `InventoryRepository extends BaseRepository<Inventory>`
2. Migrate inventory service

**Eventually:**
- Remove all Prisma dependencies
- Complete full Firestore migration
- Deprecate Prisma from project

---

## Repository Foundation Summary

| Component | Status | Lines | Purpose |
|-----------|--------|-------|---------|
| IRepository | ✅ | 235 | Generic interface contract |
| BaseRepository | ✅ | 514 | Generic CRUD implementation |
| RepositoryFactory | ✅ | 250 | Singleton & DI management |
| index.ts | ✅ | 50 | Centralized exports |
| **Total** | **✅** | **1049** | **Foundation framework** |

**No business logic**
**Full type safety**
**Production ready**

---

## Conclusion

The **Core Firestore Repository Foundation** is complete and ready for use. This generic, reusable framework provides:

✅ Type-safe data access layer
✅ Consistent CRUD operations across modules
✅ Advanced query capabilities
✅ Transaction and batch support
✅ Automatic audit trails
✅ Soft delete support
✅ Dependency injection
✅ Error handling and retry logic
✅ No business logic complexity

The framework is now ready for module-by-module migration starting with Phase 6.2.1 – Authentication Migration.

---

**Framework Status: READY FOR PRODUCTION**

**Waiting for approval to proceed to Phase 6.2.1**
