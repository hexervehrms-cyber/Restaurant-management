# 🔥 FIREBASE MIGRATION BLUEPRINT
## Restaurant Management System - Complete Architecture & Implementation Guide

**Status:** PLANNING PHASE (NO CODE MODIFICATIONS)
**Version:** 1.0
**Last Updated:** 2024
**Strategy:** Gradual Feature Migration | Preserve Frontend | Remove Prisma Last

---

## TABLE OF CONTENTS

1. [Feature Dependency Map](#part-1--feature-dependency-map)
2. [Firestore Collection Design](#part-2--firestore-collection-design)
3. [Firebase Service Architecture](#part-3--firebase-service-architecture)
4. [Repository Layer](#part-4--repository-layer)
5. [Custom Hook Migration](#part-5--custom-hook-migration)
6. [Page Migration Map](#part-6--page-migration-map)
7. [Feature Migration Order](#part-7--feature-migration-order)
8. [Project Structure](#part-8--project-structure)
9. [Migration Checklist](#part-9--migration-checklist)

---

# PART 1 – FEATURE DEPENDENCY MAP

## 1.1 All System Features & Their Dependencies

### Feature 1: Authentication
**Purpose:** User authentication, JWT tokens, session management, role-based access control

**Dependencies:**
- None (Foundation feature)

**Dependents:**
- ALL other features (core requirement)
- Authorization middleware
- User context in every service

**Data Model:**
- Users
- Roles
- Permissions
- Staff Profiles

---

### Feature 2: Restaurant Settings
**Purpose:** Configuration management, tax settings, restaurant metadata, operating hours

**Dependencies:**
- Authentication (user must be authorized)

**Dependents:**
- Dashboard (uses tax %, service charge %)
- Orders (uses tax calculation)
- Reservations (uses cancellation policies)
- Billing (uses tax settings)

**Data Model:**
- RestaurantSettings
- Restaurant
- Organization
- Branch

---

### Feature 3: Menu Management
**Purpose:** Menu items, categories, variants, modifiers, pricing

**Dependencies:**
- Authentication
- Restaurant Settings (pricing config)

**Dependents:**
- POS Terminal (displays menu items)
- Orders (creates orders from menu)
- Kitchen (receives menu items on tickets)
- Inventory (tracks stock for menu items)
- Dashboard (shows top dishes)
- CRM (customer order history)

**Data Model:**
- MenuCategory
- MenuItem
- MenuItemVariant
- Modifiers
- ModifierGroups

---

### Feature 4: Tables
**Purpose:** Table management, seating arrangements, table status, QR codes

**Dependencies:**
- Authentication
- Restaurant Settings (max tables config)

**Dependents:**
- POS Terminal (select table for order)
- Orders (associates order to table)
- Reservations (reserves specific table)
- Dashboard (shows table occupancy)

**Data Model:**
- RestaurantTable
- TableLayout
- TableQrToken

---

### Feature 5: Customers (CRM)
**Purpose:** Customer profiles, contact info, order history, loyalty points

**Dependencies:**
- Authentication

**Dependents:**
- POS Terminal (customer search & selection)
- Orders (customer association)
- Reservations (customer booking)
- Billing (customer invoice)
- Payments (customer records)

**Data Model:**
- Customer
- CustomerAddress
- CustomerNote
- CustomerLoyaltyPoints

---

### Feature 6: Orders
**Purpose:** Order creation, status management, order items, order lifecycle

**Dependencies:**
- Authentication
- Menu (order contains menu items)
- Tables (order linked to table)
- Customers (order linked to customer)
- Restaurant Settings (tax calculation)

**Dependents:**
- Kitchen (KDS displays orders)
- Billing (bill created from order)
- Reservations (after dining, order created)
- Analytics (order metrics)
- Dashboard (live orders feed)
- POS (creates orders)

**Data Model:**
- Order
- OrderItem
- OrderItemModifier
- OrderStatusLog

---

### Feature 7: Kitchen (KDS)
**Purpose:** Kitchen display system, cooking status, order tickets, preparation tracking

**Dependencies:**
- Authentication
- Menu (display menu items on tickets)
- Orders (receive orders to prepare)

**Dependents:**
- Orders (updates order status based on kitchen progress)
- Dashboard (kitchen stats)

**Data Model:**
- KitchenSection
- KitchenTicket
- KitchenTicketItem
- KitchenStatusLog

---

### Feature 8: Reservations
**Purpose:** Table reservations, booking management, advance payments, cancellations

**Dependencies:**
- Authentication
- Tables (reserve specific table)
- Customers (customer makes reservation)
- Restaurant Settings (cancellation policies, advance payment %)

**Dependents:**
- Billing (reserve with advance payment)
- Payments (process advance payments)
- Dashboard (reservation count)

**Data Model:**
- Reservation
- ReservationPayment
- ReservationNoShowLog

---

### Feature 9: Inventory
**Purpose:** Stock tracking, item management, low stock alerts, usage tracking

**Dependencies:**
- Authentication
- Menu (inventory items linked to menu)
- Restaurant Settings

**Dependents:**
- Orders (reduces inventory on order completion)
- Analytics (inventory reports)
- Purchase Orders (restock purchases)

**Data Model:**
- InventoryItem
- StockMovement
- StockAdjustment
- LowStockAlert

---

### Feature 10: Billing & Bills
**Purpose:** Bill generation, itemization, tax breakdown, bill settlement

**Dependencies:**
- Authentication
- Orders (bill created from order)
- Customers (bill issued to customer)
- Restaurant Settings (tax calculation)

**Dependents:**
- Payments (bill payment)
- Cash Register (bill settlement)
- Analytics (revenue tracking)

**Data Model:**
- Bill
- BillItem
- BillTaxBreakdown

---

### Feature 11: Payments & Payment Processing
**Purpose:** Payment recording, payment methods, Razorpay integration, refunds

**Dependencies:**
- Authentication
- Billing (payment for bill)
- Customers (customer makes payment)

**Dependents:**
- Analytics (payment metrics)
- Cash Register (cash reconciliation)
- Orders (order payment status)

**Data Model:**
- Payment
- Refund
- ReservationPayment

---

### Feature 12: Dashboard
**Purpose:** Analytics overview, KPIs, revenue charts, real-time stats

**Dependencies:**
- Authentication
- Orders (order metrics)
- Reservations (reservation count)
- Tables (occupancy %)
- Menu (top dishes)
- Inventory (alerts)
- Payments (revenue)

**Dependents:**
- None (display only)

**Data Model:**
- Uses aggregated data from multiple collections

---

### Feature 13: POS Terminal
**Purpose:** Touch-optimized order creation, cart management, quick checkout

**Dependencies:**
- Authentication
- Menu (display items)
- Tables (select table)
- Customers (customer search)
- Orders (create order)
- Bills (create bill)
- Payments (process payment)

**Dependents:**
- None (creates orders, bills, payments)

**Data Model:**
- Uses Tables, Menu, Customers, Orders, Bills, Payments

---

### Feature 14: CRM
**Purpose:** Customer relationship management, customer notes, interaction history

**Dependencies:**
- Authentication
- Customers (display customer data)

**Dependents:**
- None (analytics only)

**Data Model:**
- Customer
- CustomerNote
- Order (interaction history)

---

### Feature 15: Analytics & Reporting
**Purpose:** Business metrics, trends, performance reports, KPI tracking

**Dependencies:**
- Authentication
- All other features (aggregates data)

**Dependents:**
- None (display only)

**Data Model:**
- DailySalesReport
- BranchPerformanceReport
- Aggregated queries

---

### Feature 16: Staff Management
**Purpose:** Employee records, role assignment, branch assignments

**Dependencies:**
- Authentication (staff are users)

**Dependents:**
- Orders (waiter info)
- Kitchen (chef assignments)
- Billing (cashier assignment)

**Data Model:**
- StaffProfile
- StaffBranchAssignment
- User (role)

---

### Feature 17: Supplier & Purchase Orders
**Purpose:** Supplier management, purchase order creation, stock receipt

**Dependencies:**
- Authentication
- Menu (what to order)

**Dependents:**
- Inventory (receipt updates inventory)

**Data Model:**
- Supplier
- PurchaseOrder
- PurchaseOrderItem

---

### Feature 18: Notifications
**Purpose:** Real-time notifications, alerts, system messages

**Dependencies:**
- Authentication
- All features (triggered by events)

**Dependents:**
- None (informational)

**Data Model:**
- Notification
- NotificationSubscription (future)

---

## 1.2 Feature Dependency Graph

```
FOUNDATION
├── Authentication
│   └── (depends: None)
│       (dependents: ALL)
│
LAYER 1 - Core Configuration
├── Restaurant Settings
├── Menu Management
├── Tables
└── Customers (CRM)
    (all depend on: Auth + Settings)
    (dependents: Next layers)

LAYER 2 - Business Operations
├── Orders (depends: Auth, Menu, Tables, Customers)
├── Reservations (depends: Auth, Tables, Customers, Settings)
└── Inventory (depends: Auth, Menu)
    (dependents: Layer 3)

LAYER 3 - Transaction Processing
├── Kitchen (depends: Auth, Menu, Orders)
├── Billing (depends: Auth, Orders, Customers, Settings)
└── Staff Management (depends: Auth)
    (dependents: Layer 4)

LAYER 4 - Monetization
├── Payments (depends: Auth, Billing, Customers)
├── Purchase Orders (depends: Auth, Menu)
└── Supplier Management (depends: Auth)
    (dependents: Layer 5)

LAYER 5 - Frontend & Analytics
├── POS Terminal (depends: ALL business layers)
├── Dashboard (depends: Orders, Reservations, Inventory, Payments)
├── Analytics (depends: ALL)
├── CRM (depends: Customers)
└── Notifications (depends: ALL)
    (depends: Nothing | dependents: None)
```

---

## 1.3 Criticality & Interdependency Matrix

| Feature | Criticality | Dependencies | Dependents | Complexity |
|---------|------------|--------------|-----------|-----------|
| Authentication | CRITICAL | 0 | 18 | HIGH |
| Restaurant Settings | HIGH | 1 (Auth) | 7 | MEDIUM |
| Menu | HIGH | 1 (Auth) | 7 | MEDIUM |
| Tables | HIGH | 1 (Auth) | 5 | MEDIUM |
| Customers | HIGH | 1 (Auth) | 5 | MEDIUM |
| Orders | CRITICAL | 5 | 7 | HIGH |
| Kitchen | CRITICAL | 3 | 2 | HIGH |
| Billing | HIGH | 4 | 3 | HIGH |
| Payments | HIGH | 2 | 3 | MEDIUM |
| Reservations | MEDIUM | 4 | 2 | MEDIUM |
| Inventory | MEDIUM | 2 | 3 | MEDIUM |
| Staff | MEDIUM | 1 (Auth) | 3 | LOW |
| Dashboard | LOW | 7 | 0 | MEDIUM |
| POS Terminal | CRITICAL | 7 | 0 | HIGH |
| CRM | LOW | 2 | 0 | LOW |
| Analytics | LOW | 8 | 0 | MEDIUM |
| Supplier | LOW | 1 (Auth) | 1 | LOW |
| Notifications | LOW | 1 (Auth) | 0 | MEDIUM |

---

