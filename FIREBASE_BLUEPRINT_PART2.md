# PART 2 – FIRESTORE COLLECTION DESIGN

## 2.1 Authentication & User Management Collections

### Collection: `organizations`
**Purpose:** Multi-tenant organization management

**Document Structure:**
```
organizations/{organizationId}
├── name: string
├── slug: string (unique)
├── email: string
├── phone: string
├── country: string
├── industry: string
├── subscriptionTier: string (starter | pro | enterprise)
├── status: string (active | suspended | deleted)
├── logoUrl: string
├── websiteUrl: string
├── metadata: {
│   └── custom fields
│   }
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
├── restaurants/
├── branches/
├── users/
├── customers/
└── suppliers/
```

---

### Collection: `users`
**Purpose:** User accounts with authentication & authorization

**Document Structure:**
```
organizations/{organizationId}/users/{userId}
├── email: string (unique)
├── phone: string
├── passwordHash: string (stored securely)
├── firstName: string
├── lastName: string
├── role: enum (super_admin | restaurant_owner | branch_manager | waiter | chef | cashier | customer)
├── status: string (active | inactive | suspended)
├── isEmailVerified: boolean
├── isPhoneVerified: boolean
├── lastLoginAt: timestamp
├── lastLoginIp: string
├── failedLoginAttempts: number
├── lockedUntil: timestamp (nullable)
├── profilePictureUrl: string
├── metadata: {
│   └── custom fields
│   }
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Indexes:
├── email (unique)
├── phone
├── role
└── status
```

---

### Collection: `roles`
**Purpose:** RBAC role definitions

**Document Structure:**
```
organizations/{organizationId}/roles/{roleId}
├── name: string (unique within org)
├── description: string
├── isSystemRole: boolean
├── status: string (active | inactive)
├── permissions: array<string> (permission IDs)
├── createdAt: timestamp
└── updatedAt: timestamp

Indexes:
└── name (unique)
```

---

## 2.2 Restaurant & Configuration Collections

### Collection: `restaurants`
**Purpose:** Restaurant master data

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}
├── name: string
├── slug: string
├── email: string
├── phone: string
├── cuisineType: string
├── address: string
├── geoLocation: {
│   ├── latitude: number
│   ├── longitude: number
│   └── address: string
│   }
├── gstNumber: string
├── fssaiNumber: string
├── establishmentDate: timestamp
├── status: string (active | suspended | closed)
├── logoUrl: string
├── bannerUrl: string
├── description: string
├── operatingHours: {
│   ├── mon: { open: string, close: string }
│   ├── tue: { open: string, close: string }
│   └── ... (all 7 days)
│   }
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
├── branches/
├── settings/
├── menuCategories/
├── menuItems/
├── tables/
└── kitchen_sections/

Indexes:
├── status
└── slug
```

---

### Collection: `restaurants/{restaurantId}/branches`
**Purpose:** Branch locations of restaurant

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}
├── name: string
├── address: string
├── geoLocation: {
│   ├── latitude: number
│   ├── longitude: number
│   └── address: string
│   }
├── phone: string
├── email: string
├── managerId: string (reference to users)
├── status: string (active | inactive)
├── maxTables: number
├── isPrimary: boolean
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
├── tables/
├── kitchenSections/
└── orders/

Indexes:
└── status
```

---

### Collection: `restaurants/{restaurantId}/settings`
**Purpose:** Restaurant configuration

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/settings/{settingId}
├── taxPercentage: number (5.00)
├── serviceChargePercentage: number (0)
├── discountAllowed: boolean
├── reservationAdvancePaymentPercentage: number
├── reservationCancellationHours: number (24)
├── reservationNoShowPenalty: number
├── qrOrderAutoApprove: boolean
├── kitchenPrintEnabled: boolean
├── splitBillAllowed: boolean
├── advancePaymentRequired: boolean
├── currency: string (INR)
├── timezone: string (Asia/Kolkata)
├── createdAt: timestamp
└── updatedAt: timestamp
```

---

## 2.3 Menu Collections

### Collection: `restaurants/{restaurantId}/menuCategories`
**Purpose:** Menu item categories

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/menuCategories/{categoryId}
├── name: string (unique per restaurant)
├── description: string
├── displayOrder: number
├── iconUrl: string
├── color: string
├── isActive: boolean
├── status: string (active | inactive)
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
└── menuItems/

Indexes:
├── name (unique)
└── displayOrder
```

---

### Collection: `restaurants/{restaurantId}/menuCategories/{categoryId}/menuItems`
**Purpose:** Menu items

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/menuCategories/{categoryId}/menuItems/{itemId}
├── name: string
├── description: string
├── basePrice: number
├── costPrice: number
├── displayOrder: number
├── imageUrl: string
├── isVegetarian: boolean
├── isVegan: boolean
├── isGlutenFree: boolean
├── isSpicy: boolean (0 | 1 | 2 | 3)
├── isAvailable: boolean
├── rating: number (0-5)
├── prepTime: number (minutes)
├── status: string (active | inactive)
├── variants: array<{
│   ├── id: string
│   ├── name: string
│   └── price: number
│   }>
├── modifiers: array<string> (modifier IDs)
├── tags: array<string>
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Indexes:
├── name
├── status
└── isAvailable
```

---

### Collection: `restaurants/{restaurantId}/modifiers`
**Purpose:** Item modifiers (toppings, extras, customizations)

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/modifiers/{modifierId}
├── name: string
├── description: string
├── isMultiSelect: boolean
├── displayOrder: number
├── options: array<{
│   ├── id: string
│   ├── name: string
│   ├── price: number
│   └── order: number
│   }>
├── status: string (active | inactive)
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)
```

---

## 2.4 Table Management Collections

### Collection: `restaurants/{restaurantId}/branches/{branchId}/tables`
**Purpose:** Restaurant tables

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/tables/{tableId}
├── tableNumber: string
├── capacity: number
├── section: string (indoor | outdoor | vip | beach)
├── status: enum (available | occupied | reserved | maintenance)
├── position: {
│   ├── x: number
│   ├── y: number
│   ├── rotation: number
│   └── shape: string (round | square | rectangular)
│   }
├── color: string
├── notes: string
├── currentOrder: string (reference to order, nullable)
├── currentReservation: string (reference to reservation, nullable)
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Indexes:
├── status
├── tableNumber (unique per branch)
└── currentOrder
```

---

### Collection: `restaurants/{restaurantId}/branches/{branchId}/tableQrTokens`
**Purpose:** QR codes for table ordering

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/tableQrTokens/{tokenId}
├── tableId: string (reference)
├── token: string (unique, short code)
├── qrCodeUrl: string (URL or SVG)
├── sessionToken: string
├── isActive: boolean
├── expiresAt: timestamp
├── createdAt: timestamp
└── updatedAt: timestamp

Indexes:
└── token (unique)
```

---

## 2.5 Customer Collections

### Collection: `organizations/{organizationId}/customers`
**Purpose:** Customer profiles

**Document Structure:**
```
organizations/{organizationId}/customers/{customerId}
├── phone: string (unique per org)
├── email: string
├── firstName: string
├── lastName: string
├── dateOfBirth: timestamp
├── gender: string
├── profilePictureUrl: string
├── totalOrders: number
├── totalSpent: number
├── preferredLanguage: string
├── status: string (active | inactive)
├── customerSource: string (walk-in | delivery | reservation | loyalty)
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
├── addresses/
├── notes/
├── loyaltyPoints/
└── interactions/

Indexes:
├── phone (unique)
├── email
└── status
```

---

### Collection: `organizations/{organizationId}/customers/{customerId}/addresses`
**Purpose:** Customer addresses

**Document Structure:**
```
organizations/{organizationId}/customers/{customerId}/addresses/{addressId}
├── addressType: string (home | work | other)
├── line1: string
├── line2: string
├── city: string
├── state: string
├── postalCode: string
├── geoLocation: {
│   ├── latitude: number
│   └── longitude: number
│   }
├── isDefault: boolean
├── createdAt: timestamp
└── updatedAt: timestamp
```

---

### Collection: `organizations/{organizationId}/customers/{customerId}/loyaltyPoints`
**Purpose:** Customer loyalty tracking

**Document Structure:**
```
organizations/{organizationId}/customers/{customerId}/loyaltyPoints/{pointsId}
├── pointsBalance: number
├── lifetimePoints: number
├── lastEarnedAt: timestamp
├── lastRedeemedAt: timestamp
├── createdAt: timestamp
└── updatedAt: timestamp
```

---

## 2.6 Order Collections

### Collection: `restaurants/{restaurantId}/branches/{branchId}/orders`
**Purpose:** Orders

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/orders/{orderId}
├── orderNumber: string (unique per branch)
├── tableId: string (nullable, reference)
├── customerId: string (nullable, reference)
├── createdBy: string (user ID, reference)
├── confirmedBy: string (user ID, nullable, reference)
├── servedBy: string (user ID, nullable, reference)
├── status: enum (pending | confirmed | preparing | ready | served | cancelled | refunded)
├── orderType: enum (dine_in | takeaway | delivery)
├── items: array<{
│   ├── itemId: string
│   ├── itemName: string
│   ├── quantity: number
│   ├── basePrice: number
│   ├── variantId: string (nullable)
│   ├── variantName: string (nullable)
│   ├── modifiers: array<{
│   │   ├── modifierId: string
│   │   ├── name: string
│   │   └── price: number
│   │   }>
│   ├── specialInstructions: string
│   └── subtotal: number
│   }>
├── subtotal: number
├── taxAmount: number
├── serviceChargeAmount: number
├── discountAmount: number
├── totalAmount: number
├── paymentMethod: enum (cash | card | upi | razorpay | paytm)
├── paymentStatus: enum (pending | completed | failed | refunded)
├── notes: string
├── statusHistory: array<{
│   ├── status: string
│   ├── changedAt: timestamp
│   ├── changedBy: string
│   └── note: string (optional)
│   }>
├── kitchenTicketId: string (reference, nullable)
├── billId: string (reference, nullable)
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
└── items/ (detail view of order items)

Indexes:
├── status
├── orderNumber (unique per branch)
├── tableId
├── customerId
├── createdAt
└── paymentStatus
```

---

## 2.7 Kitchen Collections

### Collection: `restaurants/{restaurantId}/branches/{branchId}/kitchenSections`
**Purpose:** Kitchen sections (grill, fryer, pastry, etc.)

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/kitchenSections/{sectionId}
├── name: string
├── description: string
├── displayOrder: number
├── color: string
├── status: string (active | inactive)
├── createdAt: timestamp
└── updatedAt: timestamp
```

---

### Collection: `restaurants/{restaurantId}/branches/{branchId}/kitchenTickets`
**Purpose:** Kitchen tickets for preparing items

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/kitchenTickets/{ticketId}
├── ticketNumber: string (unique per branch)
├── orderId: string (reference)
├── sectionId: string (reference)
├── status: enum (pending | preparing | ready | served | cancelled)
├── items: array<{
│   ├── itemName: string
│   ├── quantity: number
│   ├── specialInstructions: string
│   ├── status: string
│   ├── prepTime: number
│   └── startedAt: timestamp (nullable)
│   }>
├── createdAt: timestamp
├── startedAt: timestamp (nullable)
├── readyAt: timestamp (nullable)
├── completedAt: timestamp (nullable)
├── notes: string
├── statusHistory: array<{
│   ├── status: string
│   ├── changedAt: timestamp
│   └── note: string
│   }>
└── updatedAt: timestamp

Indexes:
├── status
├── orderId
├── ticketNumber (unique)
└── createdAt
```

---

## 2.8 Billing & Payment Collections

### Collection: `restaurants/{restaurantId}/branches/{branchId}/bills`
**Purpose:** Bills/invoices

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/bills/{billId}
├── billNumber: string (unique per branch)
├── orderId: string (reference)
├── tableId: string (nullable, reference)
├── customerId: string (nullable, reference)
├── createdBy: string (user ID)
├── settledBy: string (user ID, nullable)
├── billType: enum (dine_in | takeaway | delivery)
├── items: array<{
│   ├── itemName: string
│   ├── quantity: number
│   ├── unitPrice: number
│   ├── totalPrice: number
│   └── tax: number
│   }>
├── subtotal: number
├── taxBreakdown: {
│   ├── sgst: number (9%)
│   ├── cgst: number (9%)
│   ├── igst: number (18%)
│   ├── vat: number
│   └── other: number
│   }
├── serviceCharge: number
├── discountAmount: number
├── roundOff: number
├── totalAmount: number
├── paymentMethod: enum (cash | card | upi | razorpay | paytm | cheque | wallet)
├── paymentStatus: enum (unpaid | partial | paid | refunded | cancelled)
├── notes: string
├── createdAt: timestamp
├── settledAt: timestamp (nullable)
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Indexes:
├── billNumber (unique)
├── orderId
├── status
└── createdAt
```

---

### Collection: `restaurants/{restaurantId}/branches/{branchId}/payments`
**Purpose:** Payment records

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/payments/{paymentId}
├── billId: string (reference, nullable)
├── customerId: string (reference)
├── amount: number
├── paymentMethod: enum (cash | card | upi | razorpay | paytm | cheque | wallet | bank_transfer)
├── paymentStatus: enum (pending | completed | failed | refunded | cancelled)
├── transactionId: string (gateway reference)
├── referenceNumber: string
├── razorpayOrderId: string (nullable)
├── razorpayPaymentId: string (nullable)
├── notes: string
├── createdBy: string (user ID)
├── createdAt: timestamp
├── updatedAt: timestamp
└── refunds: array<{
│   ├── refundId: string
│   ├── amount: number
│   ├── reason: string
│   └── createdAt: timestamp
│   }>

Indexes:
├── billId
├── customerId
├── paymentStatus
└── transactionId (unique)
```

---

## 2.9 Reservation Collections

### Collection: `restaurants/{restaurantId}/branches/{branchId}/reservations`
**Purpose:** Table reservations

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/reservations/{reservationId}
├── reservationNumber: string (unique per branch)
├── customerId: string (nullable, reference)
├── tableId: string (nullable, reference)
├── guestName: string
├── guestPhone: string
├── guestEmail: string
├── numberOfGuests: number
├── reservationDate: timestamp
├── durationMinutes: number (120)
├── status: enum (pending | confirmed | checked_in | completed | cancelled | no_show)
├── advancePaymentAmount: number
├── advancePaymentStatus: enum (pending | completed | failed | refunded)
├── cancellationReason: string (nullable)
├── noShowReason: string (nullable)
├── notes: string
├── source: string (website | phone | walk-in | app)
├── externalReferenceId: string (aggregator ref, nullable)
├── statusHistory: array<{
│   ├── status: string
│   ├── changedAt: timestamp
│   └── note: string
│   }>
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
├── payments/
└── interactions/

Indexes:
├── status
├── reservationDate
├── customerId
└── reservationNumber (unique)
```

---

## 2.10 Inventory Collections

### Collection: `restaurants/{restaurantId}/branches/{branchId}/inventory`
**Purpose:** Inventory items/stock

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/inventory/{itemId}
├── menuItemId: string (reference, nullable)
├── name: string
├── sku: string
├── unit: string (kg | liter | piece | box)
├── currentQuantity: number
├── reorderLevel: number
├── reorderQuantity: number
├── unitCost: number
├── supplier: string (supplier ID)
├── lastRestockDate: timestamp
├── expiryDate: timestamp (nullable)
├── batchNumber: string (nullable)
├── status: string (active | discontinued | low_stock | out_of_stock)
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Sub-collections:
├── movements/ (stock in/out logs)
└── adjustments/ (manual adjustments)

Indexes:
├── sku (unique per branch)
├── status
└── currentQuantity
```

---

### Collection: `restaurants/{restaurantId}/branches/{branchId}/inventory/{itemId}/movements`
**Purpose:** Stock movement logs

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/branches/{branchId}/inventory/{itemId}/movements/{movementId}
├── type: enum (in | out | adjustment | damage | waste)
├── quantity: number
├── reason: string (order | restock | manual | damage)
├── referenceId: string (order ID or PO ID)
├── balanceBefore: number
├── balanceAfter: number
├── notes: string
├── createdBy: string (user ID)
├── createdAt: timestamp
└── approvedBy: string (user ID, nullable)
```

---

## 2.11 Staff Collections

### Collection: `organizations/{organizationId}/staff`
**Purpose:** Staff profiles (extends users)

**Document Structure:**
```
organizations/{organizationId}/staff/{staffId}
├── userId: string (reference to user)
├── restaurantId: string (reference)
├── designation: string
├── employeeId: string (unique per restaurant)
├── phoneNumber: string
├── hireDate: timestamp
├── salary: number (nullable)
├── status: string (active | inactive | suspended)
├── documentUrl: string (nullable)
├── branchAssignments: array<{
│   ├── branchId: string
│   ├── startDate: timestamp
│   ├── endDate: timestamp (nullable)
│   └── isActive: boolean
│   }>
├── metadata: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── deletedAt: timestamp (nullable)

Indexes:
├── employeeId (unique per restaurant)
├── status
└── restaurantId
```

---

## 2.12 Notifications Collection

### Collection: `organizations/{organizationId}/notifications`
**Purpose:** System notifications

**Document Structure:**
```
organizations/{organizationId}/notifications/{notificationId}
├── userId: string (recipient)
├── title: string
├── message: string
├── type: enum (order | reservation | kitchen | inventory | system | payment)
├── priority: enum (low | normal | high | critical)
├── actionUrl: string (nullable)
├── isRead: boolean
├── readAt: timestamp (nullable)
├── createdAt: timestamp
└── expiresAt: timestamp

Indexes:
├── userId + isRead
├── createdAt
└── type
```

---

## 2.13 Audit & Logging Collections

### Collection: `organizations/{organizationId}/auditLogs`
**Purpose:** Audit trail for compliance

**Document Structure:**
```
organizations/{organizationId}/auditLogs/{logId}
├── userId: string (actor)
├── action: string (create | read | update | delete)
├── resource: string (orders | customers | menu, etc.)
├── resourceId: string
├── changes: {
│   ├── fieldName: { old: any, new: any }
│   └── ...
│   }
├── ipAddress: string
├── userAgent: string
├── status: string (success | failure)
├── errorMessage: string (nullable)
├── createdAt: timestamp
└── metadata: object

Indexes:
├── userId
├── action
├── resource
└── createdAt
```

---

## 2.14 Analytics Collections (Read-Only Aggregates)

### Collection: `restaurants/{restaurantId}/analytics/dailySalesReports`
**Purpose:** Daily sales aggregates (written by scheduled functions)

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/analytics/dailySalesReports/{dateId}
├── date: timestamp (date only)
├── branchId: string
├── totalOrders: number
├── totalRevenue: number
├── totalCustomers: number
├── averageOrderValue: number
├── topDishes: array<{
│   ├── name: string
│   ├── quantity: number
│   ├── revenue: number
│   └── isVegetarian: boolean
│   }>
├── paymentBreakdown: {
│   ├── cash: number
│   ├── card: number
│   ├── upi: number
│   ├── razorpay: number
│   └── other: number
│   }
├── taxCollected: number
├── discountGiven: number
├── peakHour: string (14:00-15:00)
├── peakOrderCount: number
├── createdAt: timestamp
└── updatedAt: timestamp
```

---

## 2.15 Aggregator Integration Collections

### Collection: `restaurants/{restaurantId}/aggregatorIntegrations`
**Purpose:** Aggregator API integrations (Zomato, Swiggy, etc.)

**Document Structure:**
```
organizations/{organizationId}/restaurants/{restaurantId}/aggregatorIntegrations/{integrationId}
├── aggregator: enum (zomato | swiggy | uber_eats | ondc)
├── partnerId: string
├── partnerName: string
├── apiKey: string (encrypted)
├── webhookUrl: string
├── status: string (active | inactive | suspended)
├── commissionPercentage: number
├── isMenuSynced: boolean
├── lastSyncAt: timestamp
├── metadata: object
├── createdAt: timestamp
└── updatedAt: timestamp
```

---

## 2.16 Collection Summary & Relationships

| Collection | Parent | Tenant | Purpose | Status |
|-----------|--------|--------|---------|--------|
| organizations | - | Self | Multi-tenant root | CORE |
| users | organizations | Org | Authentication | CORE |
| roles | organizations | Org | RBAC | CORE |
| restaurants | organizations | Org | Restaurant master | CORE |
| branches | restaurants | Org | Branch locations | CORE |
| settings | restaurants | Org | Config | CORE |
| menuCategories | restaurants | Org | Categories | CORE |
| menuItems | menuCategories | Org | Items | CORE |
| modifiers | restaurants | Org | Modifiers | CORE |
| tables | branches | Org | Tables | CORE |
| tableQrTokens | branches | Org | QR codes | CORE |
| customers | organizations | Org | Profiles | CORE |
| orders | branches | Org | Orders | CRITICAL |
| kitchenSections | branches | Org | Kitchen areas | CORE |
| kitchenTickets | branches | Org | Kitchen tickets | CRITICAL |
| bills | branches | Org | Bills | CRITICAL |
| payments | branches | Org | Payments | CRITICAL |
| reservations | branches | Org | Reservations | CORE |
| inventory | branches | Org | Stock | CORE |
| staff | organizations | Org | Staff profiles | CORE |
| notifications | organizations | Org | Notifications | CORE |
| auditLogs | organizations | Org | Audit trail | CORE |
| dailySalesReports | restaurants | Org | Analytics | ANALYTICS |
| aggregatorIntegrations | restaurants | Org | Aggregators | OPTIONAL |

---

