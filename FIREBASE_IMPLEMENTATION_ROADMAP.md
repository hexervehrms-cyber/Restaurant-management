# 🔥 FIREBASE IMPLEMENTATION ROADMAP
## Restaurant Management System - Future Architecture Blueprint

**Document Type:** Implementation-Oriented Architecture Guide
**Scope:** Firebase Backend Architecture (Future State)
**Frontend:** Preserved As-Is (No Changes)
**Migration Strategy:** Feature-by-Feature Gradual Migration

---

## PART 1: FEATURE-BY-FEATURE IMPLEMENTATION GUIDE

### FEATURE 1: AUTHENTICATION

#### 1.1 Current Frontend State
**Page/Component:** `app/layout.tsx` (Root Layout)
**Hooks Used:** `useAuth()`, `useAuthContext()`
**Current API:** `/api/auth/me`

#### 1.2 Future Firebase Collections
```
organizations/{orgId}/users/{userId}
└── Authentication metadata

firebase/auth
└── Firebase Authentication (managed by Firebase)
```

#### 1.3 Future Project Structure
```
services/
├── firebase/
│   ├── auth.service.ts
│   └── firebaseConfig.ts
├── AuthService.ts
└── useAuthService.ts

repositories/
├── UserRepository.ts

hooks/
├── useAuth.ts (updated)
├── useAuthContext.ts (updated)

contexts/
├── AuthContext.tsx (updated)

middleware/
├── auth.middleware.ts (updated)
```

#### 1.4 Future Firebase Service (`services/firebase/auth.service.ts`)
```typescript
// Responsibilities:
- signUp(email, password, displayName)
- signIn(email, password)
- signOut()
- getCurrentUser()
- updateUserProfile(updates)
- resetPassword(email)
- verifyIdToken(token)
- createCustomClaims(userId, claims) // Roles/permissions
- refreshToken()

// Uses Firebase SDK:
- firebase/auth
- firebase/admin (server-side)
```

#### 1.5 Future Repository (`repositories/UserRepository.ts`)
```typescript
// Firestore Operations:
- getUserProfile(userId): Promise<User>
- createUserProfile(userId, profileData): Promise<void>
- updateUserProfile(userId, updates): Promise<void>
- getUserByEmail(email): Promise<User>
- getUserRole(userId): Promise<string>
- getAllUsers(orgId): Promise<User[]>
- deleteUser(userId): Promise<void>

// Collection: organizations/{orgId}/users/{userId}
```

#### 1.6 Future Custom Hook (`hooks/useAuth.ts`)
```typescript
// Replaces current implementation
// Returns:
{
  user: User | null
  loading: boolean
  error: Error | null
  signIn: (email, password) => Promise<void>
  signUp: (email, password, name) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates) => Promise<void>
  refetch: () => Promise<void>
}

// Uses: AuthService
```

#### 1.7 Migration Checklist
- [ ] Set up Firebase project & authentication
- [ ] Create Firebase Auth rules
- [ ] Implement AuthService with all methods
- [ ] Implement UserRepository
- [ ] Update useAuth hook
- [ ] Add JWT token handling to apiClient
- [ ] Test sign-in/sign-up flow
- [ ] Test token refresh mechanism
- [ ] Verify middleware auth checks
- [ ] Create admin user in Firebase
- [ ] Update .env with Firebase config
- [ ] Test all user roles (admin, manager, waiter, etc.)
- [ ] Verify email verification flow
- [ ] Test password reset flow

#### 1.8 Requirements
**Authentication Type:** Required (Foundation)
**Priority:** HIGH
**Complexity:** MEDIUM
**Dependencies:** None
**Dependents:** ALL other features
**Estimated Time:** 10-12 hours
**Frontend Changes:** NONE (Hook updated but signature stays same)

---

### FEATURE 2: RESTAURANT SETTINGS

#### 2.1 Current Frontend State
**Pages Using:** Dashboard page (indirectly for tax calculation)
**Hooks Used:** None direct
**Current API:** None dedicated endpoint

#### 2.2 Future Firebase Collections
```
organizations/{orgId}/restaurants/{restId}/settings/{docId}
├── taxPercentage
├── serviceChargePercentage
├── currency
├── timezone
├── etc.

organizations/{orgId}/restaurants/{restId}
├── name
├── slug
├── logoUrl
├── etc.
```

#### 2.3 Future Project Structure
```
services/
├── RestaurantService.ts

repositories/
├── RestaurantRepository.ts

hooks/
├── useRestaurantSettings.ts (new)

contexts/
├── RestaurantContext.tsx (new)
```

#### 2.4 Future Firebase Service (`services/RestaurantService.ts`)
```typescript
// Responsibilities:
- getRestaurantSettings(branchId): Promise<Settings>
- updateRestaurantSettings(branchId, updates): Promise<void>
- getRestaurant(restId): Promise<Restaurant>
- updateRestaurant(restId, updates): Promise<void>
- getBranches(restId): Promise<Branch[]>
- getBranch(branchId): Promise<Branch>
- getTimezone(branchId): Promise<string>
- getTaxPercentage(branchId): Promise<number>
- getServiceChargePercentage(branchId): Promise<number>

// Uses Collections:
- organizations/{orgId}/restaurants/{restId}/settings
- organizations/{orgId}/restaurants/{restId}
- organizations/{orgId}/restaurants/{restId}/branches/{branchId}
```

#### 2.5 Future Repository (`repositories/RestaurantRepository.ts`)
```typescript
// Firestore Operations:
- getSettings(restId): Promise<Settings>
- updateSettings(restId, data): Promise<void>
- getRestaurant(restId): Promise<Restaurant>
- updateRestaurant(restId, data): Promise<void>
- getBranches(restId): Promise<Branch[]>
- getBranch(branchId): Promise<Branch>
- createBranch(restId, data): Promise<void>
- updateBranch(branchId, data): Promise<void>
- deleteBranch(branchId): Promise<void>

// Collections:
- organizations/{orgId}/restaurants/{restId}/settings
- organizations/{orgId}/restaurants/{restId}
- organizations/{orgId}/restaurants/{restId}/branches
```

#### 2.6 Future Custom Hook (`hooks/useRestaurantSettings.ts`)
```typescript
// New hook to be added
// Returns:
{
  settings: Settings | null
  loading: boolean
  error: Error | null
  updateSettings: (updates) => Promise<void>
  refetch: () => Promise<void>
}

// Uses: RestaurantService
```

#### 2.7 Migration Checklist
- [ ] Create RestaurantService
- [ ] Create RestaurantRepository
- [ ] Create useRestaurantSettings hook
- [ ] Migrate settings data from Prisma to Firestore
- [ ] Create Firestore security rules for settings
- [ ] Test getRestaurantSettings
- [ ] Test updateRestaurantSettings
- [ ] Verify tax calculation uses new settings
- [ ] Verify service charge calculation uses new settings
- [ ] Test branch operations
- [ ] Add caching strategy for settings (rarely changes)
- [ ] Create RestaurantContext for global access

#### 2.8 Requirements
**Authentication:** Required (current user's restaurant)
**Priority:** HIGH
**Complexity:** LOW
**Dependencies:** Authentication
**Dependents:** Orders, Billing, Reservations, Dashboard
**Estimated Time:** 6-8 hours
**Frontend Changes:** NONE (Optional hook addition)

---

### FEATURE 3: MENU MANAGEMENT

#### 3.1 Current Frontend State
**Page:** `app/(dashboard)/menu/page.tsx`
**Component:** `components/menu/menu-management.tsx`
**Hooks Used:** `useMenuItems()`
**Current API:** `/api/pos/menu`, `/api/menu/items`

#### 3.2 Future Firebase Collections
```
organizations/{orgId}/restaurants/{restId}/menuCategories/{categoryId}
├── name
├── description
├── displayOrder
├── iconUrl
└── color

organizations/{orgId}/restaurants/{restId}/menuCategories/{categoryId}/menuItems/{itemId}
├── name
├── description
├── basePrice
├── imageUrl
├── isVegetarian
├── variants
└── modifiers (array of modifier IDs)

organizations/{orgId}/restaurants/{restId}/modifiers/{modifierId}
├── name
├── isMultiSelect
├── options[]
```

#### 3.3 Future Project Structure
```
services/
├── MenuService.ts

repositories/
├── MenuRepository.ts
├── CategoryRepository.ts
├── ModifierRepository.ts

hooks/
├── useMenuItems.ts (updated)
├── useMenuCategories.ts (new)

constants/
├── menuConstants.ts
```

#### 3.4 Future Firebase Service (`services/MenuService.ts`)
```typescript
// Responsibilities:
- getMenuItems(restId, categoryId): Promise<MenuItem[]>
- getMenuCategories(restId): Promise<Category[]>
- getMenuItem(itemId): Promise<MenuItem>
- getModifiers(restId): Promise<Modifier[]>
- createMenuItem(restId, data): Promise<MenuItem>
- updateMenuItem(itemId, data): Promise<void>
- deleteMenuItem(itemId): Promise<void>
- createCategory(restId, data): Promise<Category>
- updateCategory(categoryId, data): Promise<void>
- deleteCategory(categoryId): Promise<void>
- createModifier(restId, data): Promise<Modifier>
- updateModifier(modifierId, data): Promise<void>
- deleteModifier(modifierId): Promise<void>
- searchMenuItems(restId, query): Promise<MenuItem[]>
- getTopDishes(branchId, days): Promise<MenuItem[]>

// Uses Collections:
- organizations/{orgId}/restaurants/{restId}/menuCategories
- organizations/{orgId}/restaurants/{restId}/menuCategories/{categoryId}/menuItems
- organizations/{orgId}/restaurants/{restId}/modifiers
```

#### 3.5 Future Repositories
```typescript
// MenuRepository.ts
- getItem(itemId): MenuItem
- getItems(categoryId): MenuItem[]
- createItem(data): MenuItem
- updateItem(itemId, data): void
- deleteItem(itemId): void

// CategoryRepository.ts
- getAll(restId): Category[]
- getCategory(categoryId): Category
- create(restId, data): Category
- update(categoryId, data): void
- delete(categoryId): void

// ModifierRepository.ts
- getAll(restId): Modifier[]
- getModifier(modifierId): Modifier
- create(restId, data): Modifier
- update(modifierId, data): void
- delete(modifierId): void
```

#### 3.6 Future Custom Hooks
```typescript
// hooks/useMenuItems.ts (updated)
- getMenuItems(categoryId)
- getMenuItem(itemId)
- createMenuItem(data)
- updateMenuItem(itemId, data)
- deleteMenuItem(itemId)
- searchMenuItems(query)

// hooks/useMenuCategories.ts (new)
- getCategories()
- createCategory(data)
- updateCategory(categoryId, data)
- deleteCategory(categoryId)

// hooks/useModifiers.ts (new)
- getModifiers()
- createModifier(data)
- updateModifier(modifierId, data)
- deleteModifier(modifierId)
```

#### 3.7 Migration Checklist
- [ ] Create MenuService with all methods
- [ ] Create MenuRepository
- [ ] Create CategoryRepository
- [ ] Create ModifierRepository
- [ ] Migrate menu items from Prisma to Firestore
- [ ] Migrate categories from Prisma to Firestore
- [ ] Migrate modifiers from Prisma to Firestore
- [ ] Create Firestore security rules (read: all, write: authenticated)
- [ ] Update useMenuItems hook
- [ ] Create useMenuCategories hook
- [ ] Create useModifiers hook
- [ ] Test menu display in POS Terminal
- [ ] Test menu display in Menu Management page
- [ ] Test menu search functionality
- [ ] Test create/update/delete menu items
- [ ] Test category management
- [ ] Test modifier management
- [ ] Add image URL handling (Cloud Storage)
- [ ] Set up Firestore indexes for search

#### 3.8 Requirements
**Authentication:** Required
**Priority:** HIGH
**Complexity:** MEDIUM
**Dependencies:** Authentication, Restaurant Settings
**Dependents:** POS, Orders, Kitchen, Dashboard
**Estimated Time:** 12-14 hours
**Frontend Changes:** NONE (Hooks updated but signatures preserved)

---

### FEATURE 4: TABLES

#### 4.1 Current Frontend State
**Page:** `app/(dashboard)/tables/page.tsx`
**Component:** `components/tables/tables-view.tsx`
**Hooks Used:** `useTables()`
**Current API:** `/api/tables`

#### 4.2 Future Firebase Collections
```
organizations/{orgId}/restaurants/{restId}/branches/{branchId}/tables/{tableId}
├── tableNumber
├── capacity
├── section
├── status (available | occupied | reserved | maintenance)
├── position { x, y, rotation }
├── color
└── currentOrder (reference)

organizations/{orgId}/restaurants/{restId}/branches/{branchId}/tableQrTokens/{tokenId}
├── tableId
├── token
├── qrCodeUrl
└── isActive
```

#### 4.3 Future Project Structure
```
services/
├── TableService.ts

repositories/
├── TableRepository.ts

hooks/
├── useTables.ts (updated)
├── useTableStatus.ts (new)

utils/
├── qrCode.ts
```

#### 4.4 Future Firebase Service (`services/TableService.ts`)
```typescript
// Responsibilities:
- getTables(branchId): Promise<Table[]>
- getTable(tableId): Promise<Table>
- getTablesByStatus(branchId, status): Promise<Table[]>
- updateTableStatus(tableId, status): Promise<void>
- createTable(branchId, data): Promise<Table>
- updateTable(tableId, data): Promise<void>
- deleteTable(tableId): Promise<void>
- getTableOccupancy(branchId): Promise<OccupancyStats>
- generateTableQrCode(tableId): Promise<string>
- getTableQrToken(tableId): Promise<string>
- generateNewQrToken(tableId): Promise<string>
- mergeOrders(table1Id, table2Id): Promise<void>

// Uses Collections:
- organizations/{orgId}/restaurants/{restId}/branches/{branchId}/tables
- organizations/{orgId}/restaurants/{restId}/branches/{branchId}/tableQrTokens
```

#### 4.5 Future Repository (`repositories/TableRepository.ts`)
```typescript
// Firestore Operations:
- getTables(branchId): Table[]
- getTable(tableId): Table
- getTablesByStatus(branchId, status): Table[]
- createTable(branchId, data): Table
- updateTable(tableId, data): void
- deleteTable(tableId): void
- updateTableStatus(tableId, status): void
- setTableCurrentOrder(tableId, orderId): void
- clearTableCurrentOrder(tableId): void
- getTableQrToken(tableId): string
- createQrToken(tableId, token): void
- updateQrToken(tokenId, data): void
- deleteQrToken(tokenId): void

// Collection:
- organizations/{orgId}/restaurants/{restId}/branches/{branchId}/tables
- organizations/{orgId}/restaurants/{restId}/branches/{branchId}/tableQrTokens
```

#### 4.6 Future Custom Hooks
```typescript
// hooks/useTables.ts (updated)
{
  tables: Table[] | null
  loading: boolean
  error: Error | null
  updateTableStatus: (tableId, status) => Promise<void>
  createTable: (data) => Promise<void>
  updateTable: (tableId, data) => Promise<void>
  deleteTable: (tableId) => Promise<void>
  refetch: () => Promise<void>
}

// hooks/useTableStatus.ts (new)
{
  occupancyPercent: number
  availableTables: number
  occupiedTables: number
  reservedTables: number
  maintenanceTables: number
  refetch: () => Promise<void>
}
```

#### 4.7 Migration Checklist
- [ ] Create TableService
- [ ] Create TableRepository
- [ ] Migrate table data from Prisma to Firestore
- [ ] Create Firestore security rules
- [ ] Create TableQrToken generator
- [ ] Implement QR code generation (use qrcode library)
- [ ] Update useTables hook
- [ ] Create useTableStatus hook
- [ ] Test table display in dashboard
- [ ] Test table status updates
- [ ] Test table occupancy calculations
- [ ] Test QR code generation
- [ ] Test table CRUD operations
- [ ] Test real-time table status updates (Firestore listeners)
- [ ] Verify POS table selection works with new data
- [ ] Add table layout persistence

#### 4.8 Requirements
**Authentication:** Required
**Priority:** HIGH
**Complexity:** MEDIUM
**Dependencies:** Authentication, Restaurant Settings
**Dependents:** POS, Orders, Reservations, Dashboard
**Estimated Time:** 10-12 hours
**Frontend Changes:** NONE (Hooks preserved)

---

### FEATURE 5: CUSTOMERS (CRM)

#### 5.1 Current Frontend State
**Page:** `app/(dashboard)/crm/page.tsx` (display only)
**Component:** `components/crm/crm-view.tsx`
**Hooks Used:** `useCRMCustomers()`
**Current API:** `/api/crm/customers`, `/api/pos/customers/search`

#### 5.2 Future Firebase Collections
```
organizations/{orgId}/customers/{customerId}
├── phone (unique)
├── email
├── firstName
├── lastName
├── dateOfBirth
├── profilePictureUrl
├── totalOrders
├── totalSpent
├── status
└── createdAt

organizations/{orgId}/customers/{customerId}/addresses/{addressId}
├── addressType
├── line1, line2
├── city, state, postalCode
└── isDefault

organizations/{orgId}/customers/{customerId}/loyaltyPoints/{docId}
├── pointsBalance
├── lifetimePoints
└── lastEarnedAt

organizations/{orgId}/customers/{customerId}/notes/{noteId}
├── note
├── createdBy
└── createdAt
```

#### 5.3 Future Project Structure
```
services/
├── CustomerService.ts

repositories/
├── CustomerRepository.ts
├── AddressRepository.ts
├── LoyaltyRepository.ts

hooks/
├── useCRMCustomers.ts (updated)
├── useCustomerSearch.ts (updated)
├── useCustomerProfile.ts (new)
├── useLoyaltyPoints.ts (new)

contexts/
├── CustomerContext.tsx (optional)
```

#### 5.4 Future Firebase Service (`services/CustomerService.ts`)
```typescript
// Responsibilities:
- getCustomers(orgId): Promise<Customer[]>
- getCustomer(customerId): Promise<Customer>
- getCustomerByPhone(phone): Promise<Customer>
- searchCustomers(query): Promise<Customer[]>
- createCustomer(data): Promise<Customer>
- updateCustomer(customerId, data): Promise<void>
- deleteCustomer(customerId): Promise<void>
- getCustomerOrders(customerId): Promise<Order[]>
- getCustomerReservations(customerId): Promise<Reservation[]>
- getCustomerLoyaltyPoints(customerId): Promise<LoyaltyPoints>
- addLoyaltyPoints(customerId, points): Promise<void>
- redeemLoyaltyPoints(customerId, points): Promise<void>
- addCustomerAddress(customerId, data): Promise<void>
- updateCustomerAddress(addressId, data): Promise<void>
- deleteCustomerAddress(addressId): Promise<void>
- addCustomerNote(customerId, note, createdBy): Promise<void>
- getCustomerNotes(customerId): Promise<Note[]>

// Uses Collections:
- organizations/{orgId}/customers
- organizations/{orgId}/customers/{customerId}/addresses
- organizations/{orgId}/customers/{customerId}/loyaltyPoints
- organizations/{orgId}/customers/{customerId}/notes
```

#### 5.5 Future Repositories
```typescript
// CustomerRepository.ts
- getAll(orgId): Customer[]
- getById(customerId): Customer
- getByPhone(phone): Customer
- search(query): Customer[]
- create(data): Customer
- update(customerId, data): void
- delete(customerId): void

// AddressRepository.ts
- getAddresses(customerId): Address[]
- createAddress(customerId, data): Address
- updateAddress(addressId, data): void
- deleteAddress(addressId): void

// LoyaltyRepository.ts
- getPoints(customerId): LoyaltyPoints
- addPoints(customerId, amount): void
- redeemPoints(customerId, amount): void
```

#### 5.6 Future Custom Hooks
```typescript
// hooks/useCRMCustomers.ts (updated)
{
  customers: Customer[] | null
  loading: boolean
  error: Error | null
  createCustomer: (data) => Promise<void>
  updateCustomer: (customerId, data) => Promise<void>
  deleteCustomer: (customerId) => Promise<void>
  refetch: () => Promise<void>
}

// hooks/useCustomerSearch.ts (updated)
{
  results: Customer[] | null
  loading: boolean
  error: Error | null
  search: (query) => Promise<void>
  clear: () => void
}

// hooks/useCustomerProfile.ts (new)
{
  customer: Customer | null
  addresses: Address[]
  notes: Note[]
  orders: Order[]
  loading: boolean
  addNote: (note) => Promise<void>
  addAddress: (address) => Promise<void>
  refetch: () => Promise<void>
}

// hooks/useLoyaltyPoints.ts (new)
{
  points: LoyaltyPoints | null
  addPoints: (amount) => Promise<void>
  redeemPoints: (amount) => Promise<void>
}
```

#### 5.7 Migration Checklist
- [ ] Create CustomerService
- [ ] Create CustomerRepository, AddressRepository, LoyaltyRepository
- [ ] Migrate customers from Prisma to Firestore
- [ ] Create Firestore security rules
- [ ] Create Firestore composite indexes (for search)
- [ ] Update useCRMCustomers hook
- [ ] Update useCustomerSearch hook
- [ ] Create useCustomerProfile hook
- [ ] Create useLoyaltyPoints hook
- [ ] Test customer search in POS
- [ ] Test customer creation from POS
- [ ] Test customer profile display
- [ ] Test loyalty points operations
- [ ] Test address management
- [ ] Test customer notes
- [ ] Test customer deletion and soft delete
- [ ] Add phone/email validation
- [ ] Implement fuzzy search for customer names
- [ ] Test pagination for customer list
- [ ] Add customer filtering (by status, loyalty tier)

#### 5.8 Requirements
**Authentication:** Required
**Priority:** HIGH
**Complexity:** MEDIUM
**Dependencies:** Authentication
**Dependents:** POS, Orders, Reservations, CRM page
**Estimated Time:** 12-14 hours
**Frontend Changes:** NONE (Hooks preserved)

---

