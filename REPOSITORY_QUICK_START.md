# Repository Framework – Quick Start Guide

**Phase:** 6.1.4 – Core Repository Foundation
**Status:** ✅ Production Ready

---

## 📦 What You Have

A generic, reusable **Firestore repository framework** with:

- ✅ `IRepository<T>` - Generic interface contract
- ✅ `BaseRepository<T>` - Generic CRUD implementation
- ✅ `RepositoryFactory` - Singleton dependency injection container
- ✅ Full TypeScript type safety
- ✅ Support for transactions, batch operations, soft delete, and pagination

---

## 🚀 Quick Usage

### 1. Create a Repository

```typescript
// types/user.ts
import { RestaurantScopedDocument } from '@/repositories'

export interface User extends RestaurantScopedDocument {
  email: string
  password: string
  role: 'admin' | 'manager' | 'staff'
  status: 'active' | 'inactive'
}

// repositories/user/UserRepository.ts
import { BaseRepository, IRepository, COLLECTIONS } from '@/repositories'

export class UserRepository extends BaseRepository<User> implements IRepository<User> {
  constructor() {
    super(COLLECTIONS.users)
  }
  
  // NO business logic here
  // Only inherit from BaseRepository
}
```

### 2. Register Repository

```typescript
// During app initialization (e.g., in server.ts or main setup)
import { RepositoryFactory } from '@/repositories'
import { UserRepository } from '@/repositories/user'
import { COLLECTIONS } from '@/firestore/collections'

RepositoryFactory.register('users', UserRepository, COLLECTIONS.users)
```

### 3. Use in Service

```typescript
// services/UserService.ts
import { RepositoryFactory } from '@/repositories'
import { UserRepository } from '@/repositories/user'

export class UserService {
  private userRepo = RepositoryFactory.resolve<UserRepository>('users')
  
  // CRUD Operations
  async getUserById(id: string) {
    return await this.userRepo.findById(id)
  }
  
  async getActiveUsers(orgId: string) {
    return await this.userRepo.findMany({
      filters: [
        { field: 'status', operator: '==', value: 'active' },
        { field: 'organizationId', operator: '==', value: orgId }
      ],
      orders: [{ field: 'createdAt', direction: 'desc' }]
    })
  }
  
  async createUser(data: Omit<User, keyof BaseDocument>, userId: string, orgId: string) {
    // Business logic here (validation, etc.)
    if (!data.email) throw new Error('Email required')
    
    // Use repository
    const result = await this.userRepo.create(data, userId, orgId)
    if (!result.success) throw new Error(result.error)
    return result.data
  }
  
  async updateUser(id: string, updates: Partial<User>, userId: string) {
    return await this.userRepo.update(id, updates, userId)
  }
  
  async deleteUser(id: string, userId: string) {
    return await this.userRepo.delete(id, userId) // Soft delete
  }
  
  async restoreUser(id: string, userId: string) {
    return await this.userRepo.restore(id, userId) // Undo delete
  }
}
```

### 4. Use in Controller/API

```typescript
// controllers/UserController.ts
export class UserController {
  private userService = new UserService()
  
  async getUser(req, res) {
    try {
      const user = await this.userService.getUserById(req.params.id)
      res.json(user)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
  
  async createUser(req, res) {
    try {
      const user = await this.userService.createUser(
        req.body,
        req.user.id,
        req.user.organizationId
      )
      res.status(201).json(user)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  }
}
```

---

## 📚 Available Operations

### Read Operations

```typescript
// Single document
const user = await userRepo.findById('user-123')

// All documents (use with caution!)
const allUsers = await userRepo.getAll()

// Query with filters and ordering
const users = await userRepo.findMany({
  filters: [
    { field: 'status', operator: '==', value: 'active' },
    { field: 'role', operator: '==', value: 'admin' }
  ],
  orders: [{ field: 'createdAt', direction: 'desc' }],
  limit: 20
})

// Check if exists
const exists = await userRepo.exists('user-123')

// Count matching
const count = await userRepo.count({
  filters: [{ field: 'status', operator: '==', value: 'active' }]
})
```

### Write Operations

```typescript
// Create with auto ID
const result = await userRepo.create(userData, userId, orgId)

// Create with specific ID
const result = await userRepo.createWithId(id, userData, userId, orgId)

// Update
const result = await userRepo.update(id, updates, userId)

// Soft delete
const result = await userRepo.delete(id, userId)

// Restore
const result = await userRepo.restore(id, userId)
```

### Pagination

```typescript
// Cursor pagination (RECOMMENDED - better performance)
const page1 = await userRepo.findWithCursorPagination(
  { filters: [...] },
  { pageSize: 20 }
)

// Next page
const page2 = await userRepo.findWithCursorPagination(
  { filters: [...] },
  { pageSize: 20, startAfter: page1.lastSnapshot }
)

// Offset pagination (DEPRECATED - use cursor pagination)
const result = await userRepo.findWithPagination(
  { filters: [...] },
  { pageSize: 20, pageNumber: 2 }
)
```

### Batch Operations

```typescript
const result = await userRepo.batchWrite((batch) => {
  batch.set(docRef1, data1)
  batch.update(docRef2, data2)
  batch.delete(docRef3)
})

console.log(result.successCount, result.failureCount)
```

### Transactions

```typescript
const result = await userRepo.transaction(async (transaction) => {
  const snap = await transaction.get(userDocRef)
  const current = snap.data().score
  
  transaction.update(userDocRef, { score: current + 10 })
  
  return current + 10
})
```

---

## 🔍 Query Filter Operators

```typescript
// Equality
{ field: 'status', operator: '==', value: 'active' }

// Inequality
{ field: 'status', operator: '!=', value: 'deleted' }

// Comparison
{ field: 'age', operator: '>', value: 18 }
{ field: 'age', operator: '>=', value: 18 }
{ field: 'age', operator: '<', value: 65 }
{ field: 'age', operator: '<=', value: 65 }

// Array operations
{ field: 'tags', operator: 'array-contains', value: 'vip' }
{ field: 'status', operator: 'in', value: ['active', 'pending'] }
{ field: 'tags', operator: 'array-contains-any', value: ['vip', 'premium'] }
```

---

## 💡 Best Practices

### ✅ DO

- ✅ Extend `BaseRepository<T>` for module repositories
- ✅ Implement `IRepository<T>` interface
- ✅ Put business logic in services, not repositories
- ✅ Use cursor pagination for large datasets
- ✅ Use transactions for multi-document operations
- ✅ Use batch operations for bulk writes
- ✅ Register repositories during app startup
- ✅ Resolve repositories from factory in services
- ✅ Use filters to avoid loading all documents
- ✅ Include userId and organizationId in CRUD operations

### ❌ DON'T

- ❌ Add business logic to repositories
- ❌ Use `getAll()` for large collections
- ❌ Use offset pagination (deprecated)
- ❌ Create repositories directly without registering
- ❌ Hardcode collection names (use COLLECTIONS)
- ❌ Bypass repository for Firestore queries
- ❌ Keep references to repository instances (resolve from factory)

---

## 📖 Common Patterns

### Pattern: Query Builder

```typescript
// Build complex queries
const result = await orderRepo.findMany({
  filters: [
    { field: 'status', operator: '!=', value: 'cancelled' },
    { field: 'restaurantId', operator: '==', value: restaurantId },
    { field: 'createdAt', operator: '>=', value: startDate },
    { field: 'totalAmount', operator: '>', value: 50 }
  ],
  orders: [
    { field: 'createdAt', direction: 'desc' },
    { field: 'totalAmount', direction: 'desc' }
  ],
  limit: 100
})
```

### Pattern: Pagination Loop

```typescript
let cursor
let hasMore = true

while (hasMore) {
  const result = await userRepo.findWithCursorPagination(
    { filters: [...] },
    { pageSize: 100, startAfter: cursor }
  )
  
  // Process result.data
  console.log(`Processing ${result.data.length} items`)
  
  hasMore = result.hasMore
  cursor = result.lastSnapshot
}
```

### Pattern: Transaction with Error Handling

```typescript
try {
  const result = await orderRepo.transaction(async (transaction) => {
    // Get current state
    const snap = await transaction.get(orderRef)
    if (!snap.exists) throw new Error('Order not found')
    
    // Validate
    const order = snap.data()
    if (order.status !== 'pending') {
      throw new Error('Order is not in pending state')
    }
    
    // Update
    transaction.update(orderRef, { status: 'confirmed' })
    
    return order
  })
  
  console.log('Order confirmed:', result)
} catch (error) {
  console.error('Failed to confirm order:', error.message)
}
```

### Pattern: Batch Create

```typescript
const result = await userRepo.batchWrite((batch) => {
  users.forEach((userData, index) => {
    const docRef = userRepo.getCollection().doc(`user-${index}`)
    batch.set(docRef, userData)
  })
})

console.log(`Created ${result.successCount} users`)
```

---

## 🛠️ Debugging

### Check Registered Repositories

```typescript
const registered = RepositoryFactory.getRegistered()
console.log('Registered repositories:', registered)
// Output: ['users', 'orders', 'customers']

const info = RepositoryFactory.getAllInfo()
console.log('Repository info:', info)
// Output: [
//   { name: 'users', collectionName: 'users' },
//   { name: 'orders', collectionName: 'orders' },
//   ...
// ]
```

### Get Specific Repository Info

```typescript
const info = RepositoryFactory.getInfo('users')
console.log('User repo collection:', info?.collectionName)
```

### Testing - Reset Factory

```typescript
// In test setup
beforeEach(() => {
  RepositoryFactory.clear()
})

// Register test repositories
RepositoryFactory.register('users', MockUserRepository, 'users')
```

---

## 📋 Full Example

```typescript
// types/Product.ts
import { RestaurantScopedDocument } from '@/repositories'

export interface Product extends RestaurantScopedDocument {
  name: string
  price: number
  category: string
  description: string
  available: boolean
}

// repositories/product/ProductRepository.ts
import { BaseRepository, IRepository, COLLECTIONS } from '@/repositories'

export class ProductRepository extends BaseRepository<Product> implements IRepository<Product> {
  constructor() {
    super(COLLECTIONS.menuItems)
  }
}

// services/ProductService.ts
import { RepositoryFactory } from '@/repositories'

export class ProductService {
  private repo = RepositoryFactory.resolve<ProductRepository>('products')
  
  async getProductsByCategory(category: string, restaurantId: string) {
    return await this.repo.findMany({
      filters: [
        { field: 'category', operator: '==', value: category },
        { field: 'restaurantId', operator: '==', value: restaurantId },
        { field: 'available', operator: '==', value: true }
      ],
      orders: [{ field: 'name', direction: 'asc' }]
    })
  }
  
  async createProduct(data: Omit<Product, keyof BaseDocument>, userId: string, restaurantId: string) {
    if (!data.name || !data.price) throw new Error('Name and price required')
    if (data.price < 0) throw new Error('Price cannot be negative')
    
    return await this.repo.create(data, userId, restaurantId)
  }
}

// During app init (e.g., server.ts)
import { RepositoryFactory } from '@/repositories'
import { ProductRepository } from '@/repositories/product'
import { COLLECTIONS } from '@/firestore/collections'

RepositoryFactory.register('products', ProductRepository, COLLECTIONS.menuItems)
```

---

## 📚 Documentation

- **Full Details:** `REPOSITORY_FOUNDATION_REPORT.md`
- **Completion Summary:** `PHASE_6_1_4_COMPLETION_SUMMARY.md`
- **This Guide:** `REPOSITORY_QUICK_START.md`

---

## ✅ You're Ready!

The repository framework is production-ready. Start migrating your modules:

1. Create module repository (extend BaseRepository)
2. Register with RepositoryFactory
3. Migrate service to use repository
4. Update API endpoints
5. Test thoroughly

Next module to migrate: **Authentication** (Phase 6.2.1)

---

**Questions?** Refer to the full documentation or check existing implementations as they're created.
