# Phase 6.1.2 – Database Standards & Conventions
**Date:** July 13, 2026  
**Status:** DESIGN ONLY  
**Purpose:** Define naming conventions, data types, and reusable patterns for all collections  

---

## Naming Conventions

### Collection Names

**Rule:** `snake_case` for collection names

```
✅ CORRECT:
/organizations
/menu_items
/order_items
/kitchen_tickets
/customer_addresses
/daily_summaries

❌ WRONG:
/Organizations
/MenuItems
/orderItems
/KitchenTickets
/Customer_Addresses
```

### Document IDs

**Strategy:** UUID for most collections

```
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Exceptions:**

1. **Users:** Equals Firebase Auth UID
   ```
   /users/{firebaseAuthUid}
   ```

2. **Loyalty Points:** Fixed "main" document
   ```
   /organizations/{orgId}/customers/{customerId}/loyalty_points/main
   ```

3. **Daily Summaries:** Date-based key
   ```
   /organizations/{orgId}/.../daily_summaries/2024-07-13
   ```

4. **Settings:** Fixed "main" document
   ```
   /organizations/{orgId}/restaurants/{restId}/settings/main
   ```

### Field Names

**Rule:** `camelCase` for all fields

```
✅ CORRECT:
firstName
lastName
createdAt
organizationId
phoneNumber
isEmailVerified
totalSpent

❌ WRONG:
first_name
LastName
created_at
organization_id
phone_number
isemailverified
total_spent
```

### Boolean Field Naming

**Rule:** `is[Property]` or `has[Property]` for booleans

```
✅ CORRECT:
isActive
isDeleted
isAvailable
isEmailVerified
isDefault
isRequired
hasChildren

❌ WRONG:
active
deleted
available
emailVerified
default
required
children
```

### Timestamp Field Naming

**Rule:** `[Verb]At` or `[Noun]Timestamp`

```
✅ CORRECT:
createdAt
updatedAt
deletedAt
lastLoginAt
servedAt
preparedAt
settledAt

❌ WRONG:
createdTime
updated_at
deleted_timestamp
last_login
served
prepared
settled_date
```

### ID Reference Field Naming

**Rule:** `{Entity}Id` or `{Entity}By` for user references

```
✅ CORRECT:
customerId
menuItemId
restaurantId
createdBy
updatedBy
deletedBy
changedBy

❌ WRONG:
customer
menuItem
restaurant
creator
modifier
deleter
changer
```

### Array/Map Field Naming

**Rule:** Plural for arrays, singular for maps

```
✅ CORRECT:
tags: ["spicy", "vegetarian"]        // plural array
items: [{ }, { }]                    // plural array
metadata: { key: "value" }           // singular map
operatingHours: { monday: {...} }   // singular map

❌ WRONG:
tag: ["spicy", "vegetarian"]
item: [{ }, { }]
metadatas: { key: "value" }
operating_hour: { monday: {...} }
```

---

## Data Types

### Firestore Native Types

| Type | Usage | Example |
|------|-------|---------|
| **string** | Text data | "John Doe", "restaurant@example.com" |
| **number** | Integers/decimals (not for money!) | quantity: 5, rating: 4.5 |
| **Firestore.Numeric** | Precise decimal (REQUIRED for money) | price: Numeric("99.99") |
| **boolean** | True/false flags | isActive: true, isDeleted: false |
| **timestamp** | Dates and times | createdAt: Timestamp.now() |
| **date** | Date only (no time) | reservationDate: Date("2024-07-13") |
| **map** | Object/JSON | metadata: { key: "value" } |
| **array** | Lists | tags: ["tag1", "tag2"] |
| **geopoint** | Latitude/Longitude | location: GeoPoint(28.6139, 77.2090) |
| **reference** | Document reference | customerId: "cust-123" (as string in this design) |

### Numeric Precision (CRITICAL)

**Never use `number` for money:**

```
❌ WRONG:
{
  "totalAmount": 99.99,  // Will have floating point errors!
  "taxAmount": 5.00
}

✅ CORRECT (using Firestore.Numeric):
{
  "totalAmount": { "type": "double", "value": "99.99" },
  "taxAmount": { "type": "double", "value": "5.00" }
}

// OR in application code (Firebase SDK):
admin.firestore.Numeric("99.99")
```

**Why:** Floating point arithmetic causes rounding errors. Firestore.Numeric handles precise decimal operations.

### Timestamps

**Format:** ISO 8601 with UTC timezone

```
✅ CORRECT:
"2024-07-13T14:30:45.123Z"
Server-generated via Timestamp.now()

❌ WRONG:
"07/13/2024"
"2024-07-13T14:30:45"  (no timezone)
"1689270645000"  (milliseconds since epoch)
```

**Always use:** `Timestamp.now()` on server (never client time)

---

## Base Model / Standard Fields

### Every Document Should Include

All collections inherit these fields:

```json
{
  "id": "uuid",                      // Document ID
  "organizationId": "uuid",          // Multi-tenancy (except users/org-level)
  "createdAt": "timestamp",          // Server-generated
  "updatedAt": "timestamp",          // Server-generated
  "createdBy": "userId",             // Who created
  "updatedBy": "userId",             // Who updated
  "deletedAt": "timestamp|null",     // Soft delete time
  "isDeleted": false,                // Soft delete flag (always query with this)
  "deletedBy": "userId|null"         // Who deleted
}
```

### Additional Metadata

Optional for any collection:

```json
{
  "metadata": {
    "custom_key_1": "value",
    "custom_key_2": 123
  }
}
```

### Branch-Scoped Collections Also Include

```json
{
  "branchId": "uuid",                // Which branch
  "restaurantId": "uuid",            // Which restaurant
  // ... plus base model fields
}
```

---

## Soft Delete Strategy

### Implementation Pattern

```
DELETE NEVER means permanent removal.

1. Set deletedAt = Timestamp.now()
2. Set isDeleted = true
3. Set deletedBy = userId
4. Keep all historical data intact

ALL QUERIES must include:
where('isDeleted', '==', false)
```

### Query Pattern

```
WRONG (will include deleted records):
db.collection('orders').where('branchId', '==', 'branch-123').get()

CORRECT (excludes deleted):
db.collection('orders')
  .where('branchId', '==', 'branch-123')
  .where('isDeleted', '==', false)
  .get()
```

### Permanent Deletion

**Never manually delete documents.** Instead:

```
Retention policy:
- Soft delete data kept for 90 days minimum
- After 90 days, run archival job
- Move deleted docs to /archive collection
- Hard delete after 1 year (legal hold)
```

---

## Enum Values

### Status Enums

**Organization Status:**
```
active, inactive, suspended
```

**User Status:**
```
active, inactive
```

**Restaurant/Branch Status:**
```
active, inactive
```

**Order Status:**
```
pending, confirmed, preparing, ready, served, cancelled, refunded
```

**Payment Status:**
```
pending, completed, failed, refunded, partially_refunded, cancelled
```

**Bill Status:**
```
open, paid, cancelled
```

**Kitchen Ticket Status:**
```
pending, preparing, ready, served, cancelled
```

**Table Status:**
```
available, occupied, reserved, maintenance
```

**Reservation Status:**
```
pending, confirmed, checked_in, completed, cancelled, no_show
```

**Inventory Status:**
```
active, inactive
```

### Enum Naming Rule

- **Lowercase** with underscores if multiple words
- **Values** are database values (NOT display strings)
- **Translation** happens in UI layer

```
✅ CORRECT (database):
status: "dine_in"

❌ WRONG:
status: "Dine In"
status: "dineIn"

// UI translation:
const statusLabels = {
  "dine_in": "Dine In",
  "takeaway": "Takeaway",
  "delivery": "Delivery"
}
```

---

## Decimal/Money Handling

### For All Monetary Fields

Use `Firestore.Numeric` or store as string to preserve precision:

```
Collections requiring Firestore.Numeric:
- Orders (subtotal, taxAmount, discountAmount, totalAmount, serviceCharge)
- Bills (all amount fields)
- Payments (amount)
- Refunds (refundAmount)
- Menu Items (basePrice, costPrice)
- Modifiers (priceModifier)
- Variants (priceModifier)
- Inventory (costPerUnit)
- Purchase Orders (totalAmount, unitCost, lineTotal)
```

### Implementation Example

```typescript
// Server-side (Node.js):
const db = admin.firestore();
const order = {
  totalAmount: admin.firestore.Numeric("299.99"),
  taxAmount: admin.firestore.Numeric("15.00"),
  discountAmount: admin.firestore.Numeric("0.00")
};

// Client-side (Web SDK - not available in v9+):
// Use string serialization, convert on backend:
const order = {
  totalAmount: "299.99",
  taxAmount: "15.00"
};
```

---

## Array Handling

### Scalable Arrays

**DON'T store large arrays in documents** (limit 20,000 elements per document)

```
❌ WRONG:
{
  "allCustomerOrders": ["order-1", "order-2", ..., "order-10000"]
}

✅ CORRECT:
Query collection:
db.collection('orders')
  .where('customerId', '==', 'cust-123')
  .get()
```

### Fixed-Size Arrays

OK to store in document if data is small and bounded:

```
✅ CORRECT (bounded, small):
{
  "operatingHours": {
    "monday": { "open": "10:00", "close": "23:00" },
    "tuesday": { "open": "10:00", "close": "23:00" }
  },
  "tags": ["spicy", "vegetarian"],
  "allergens": ["peanuts", "dairy"]
}
```

---

## Audit Field Pattern

### Audit Trail Capture

For all documents, capture:

```json
{
  "createdAt": "timestamp",
  "createdBy": "user-123",
  "updatedAt": "timestamp",
  "updatedBy": "user-123",
  "deletedAt": "timestamp|null",
  "isDeleted": false,
  "deletedBy": "user-123|null"
}
```

### Immutable Fields

Never update these after creation:

```
- id (document ID)
- organizationId
- createdAt
- createdBy
```

### Fields That Auto-Update

On every write, server updates:

```
- updatedAt = Timestamp.now()
- updatedBy = request.auth.uid
```

---

## Query Optimization Rules

### Always Include organizationId

```
❌ WRONG:
db.collection('orders').get()

✅ CORRECT:
db.collection('organizations/{orgId}/restaurants/{restId}/branches/{branchId}/orders')
  .where('organizationId', '==', orgId)
  .get()
```

### Always Filter isDeleted

```
❌ WRONG:
db.collection('orders')
  .where('status', '==', 'pending')
  .get()

✅ CORRECT:
db.collection('orders')
  .where('isDeleted', '==', false)
  .where('status', '==', 'pending')
  .get()
```

### Limit Results

```
✅ CORRECT:
db.collection('orders')
  .where('branchId', '==', branchId)
  .where('isDeleted', '==', false)
  .orderBy('createdAt', 'desc')
  .limit(100)
  .get()

❌ WRONG:
db.collection('orders').get()  // Could be millions!
```

---

## Denormalization Guidelines

### When to Denormalize

Store copy of data in document when:
- Field is **read frequently** (> 100 times/day)
- Field **rarely changes** (< 10 times/day)
- Field is **small** (< 1 KB)

### Example: Order Documents

```
Denormalize:
- orderNumber (immutable)
- customerName, customerPhone (for KOT display)
- tableNumber (for seating display)

Don't denormalize:
- restaurantName (can change)
- itemPrice (stored separately to capture price at order time)
- statusHistory (stored in separate logs)
```

### Update Pattern

When denormalized field changes:
1. Update source document
2. Update Cloud Function to propagate change
3. Update recent related documents (e.g., last 7 days)
4. Accept historical inconsistency (old records keep old value)

---

## ID Generation Strategy

### UUID v4

```typescript
// Generate UUID:
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();

// Firestore stores as string:
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Advantages

- ✅ Globally unique
- ✅ No collision risk
- ✅ Client can generate (useful for optimistic updates)
- ✅ No sequential patterns (security benefit)
- ✅ Database/language agnostic

### Special IDs

**Exceptions:** Some collections use special ID strategies

1. **Users:** Firebase Auth UID (set by Firebase)
2. **Settings:** Fixed "main" (one settings doc per restaurant)
3. **Loyalty Points:** Fixed "main" per customer
4. **Daily Summaries:** Date string "YYYY-MM-DD"

---

## Validation Rules

### Server-Side Validation (Firestore Rules)

```
// Example:
- email field must match regex: ^[^\s@]+@[^\s@]+\.[^\s@]+$
- phone field must match regex: ^\+?[\d\s\-\(\)]{7,}$
- orderType must be in ["dine_in", "takeaway", "delivery"]
- status must transition validly (pending → confirmed, not pending → served)
```

### Application-Level Validation

In Cloud Functions and backend:

```typescript
// Before saving:
- Verify referenced documents exist
- Validate business logic (table capacity, stock levels)
- Calculate derived fields (totals, taxes)
- Check permissions again (defense in depth)
```

---

## Document Structure Examples

### Order Document

```json
{
  "id": "ord-550e8400-e29b-41d4-a716-446655440000",
  "branchId": "branch-123",
  "restaurantId": "rest-456",
  "organizationId": "org-789",
  "orderNumber": "ORD-20260713-0045",
  "customerId": "cust-321",
  "tableId": "tbl-5",
  "orderType": "dine_in",
  "status": "confirmed",
  "paymentStatus": "pending",
  "subtotal": "320.00",
  "discountAmount": "0.00",
  "discountPercentage": 0,
  "taxAmount": "16.00",
  "serviceCharge": "0.00",
  "totalAmount": "336.00",
  "notes": "No onions",
  "source": "mobile_app",
  "preparedAt": null,
  "servedAt": null,
  "cancelledAt": null,
  "metadata": {},
  "createdAt": "2024-07-13T12:30:00.000Z",
  "updatedAt": "2024-07-13T12:35:00.000Z",
  "createdBy": "user-111",
  "updatedBy": "user-111",
  "deletedAt": null,
  "isDeleted": false,
  "deletedBy": null
}
```

### Menu Item Document

```json
{
  "id": "item-550e8400-e29b-41d4-a716-446655440001",
  "restaurantId": "rest-456",
  "organizationId": "org-789",
  "categoryId": "cat-100",
  "name": "Paneer Tikka",
  "description": "Cottage cheese marinated in spiced yogurt",
  "basePrice": "320.00",
  "costPrice": "120.00",
  "displayOrder": 1,
  "imageUrl": "https://example.com/paneer.jpg",
  "isVegetarian": true,
  "isVegan": false,
  "isSpicy": false,
  "spiceLevel": 2,
  "preparationTimeMinutes": 15,
  "allergens": "dairy",
  "nutritionalInfo": {
    "calories": 250,
    "protein": "15g"
  },
  "isAvailable": true,
  "status": "active",
  "metadata": {},
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-07-13T14:20:00.000Z",
  "createdBy": "user-111",
  "updatedBy": "user-111",
  "deletedAt": null,
  "isDeleted": false,
  "deletedBy": null
}
```

---

## Testing Standards

### Data Type Validation Tests

```
Test every field for:
- Correct data type
- Non-null when required
- Valid enum values
- String length constraints
- Number ranges
- Date formats
```

### Query Testing

```
Test every index for:
- Query returns correct results
- No documents excluded unexpectedly
- Performance within SLA (< 200ms)
- Sort order correct
```

### Security Testing

```
Test every rule for:
- Authorized user can access
- Unauthorized user cannot
- Cross-tenant data not leaking
- Role-based rules enforced
```

