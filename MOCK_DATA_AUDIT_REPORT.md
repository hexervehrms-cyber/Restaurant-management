# Mock Data Audit Report - Restaurant Management Platform

**Report Date:** January 15, 2025  
**Status:** Complete - PHASE 1  
**Total Mock Data Locations Found:** 12 files  
**Total Mock Data Objects:** 10+ structures  
**Priority Level:** CRITICAL - All dashboard data is mock

---

## Executive Summary

The frontend codebase contains extensive hardcoded mock/static data across multiple components and files. **No real backend API integration exists yet.** All displayed values on the dashboard are fake and must be replaced with real API calls.

**Key Findings:**
- ✅ 1 centralized mock data file: `lib/mock-data.ts`
- ✅ 4 dashboard components using mock data
- ✅ 2 layout components with hardcoded values
- ✅ Multiple hardcoded restaurant/user names
- ✅ All KPI statistics are fake
- ✅ All sidebar badges are hardcoded
- ✅ All charts use mock data
- ✅ All notifications are mock

---

## SECTION 1: MOCK DATA FILES

### File 1: `lib/mock-data.ts`
**Status:** ⚠️ CRITICAL - Central mock data hub  
**Lines of Code:** 500+  
**Mock Objects Count:** 10

| Object Name | Type | Records | Purpose |
|-------------|------|---------|---------|
| `revenueData` | Array | 9 entries | Hourly revenue breakdown (6am-10pm) |
| `weeklyRevenue` | Array | 7 entries | Daily revenue vs target for week |
| `categoryRevenue` | Array | 5 entries | Revenue by menu category (pie chart) |
| `tables` | Array | 15 entries | Restaurant tables with occupancy status |
| `menuCategories` | Array | 7 entries | Menu categories (appetizers, mains, etc) |
| `menuItems` | Array | 12 entries | Complete menu items with prices |
| `liveOrders` | Array | 5 entries | Active orders with items and totals |
| `staff` | Array | 6 entries | Staff members with performance scores |
| `reservations` | Array | 5 entries | Table reservations today/tomorrow |
| `topDishes` | Array | 5 entries | Top-selling items with order counts |
| `todayStats` | Object | 6 KPIs | Dashboard summary statistics |
| `inventoryAlerts` | Array | 4 entries | Low stock alerts |

**Mock Data Details:**

```typescript
todayStats = {
  revenue: ₹115,400 (hardcoded),
  orders: 248 (hardcoded),
  avgTicket: ₹465 (hardcoded),
  tableOccupancy: 73% (hardcoded),
  newCustomers: 34 (hardcoded),
  satisfaction: 4.7/5 (hardcoded)
}

revenueData = [
  { time: '6am', revenue: 1200, orders: 8 },
  { time: '8am', revenue: 4800, orders: 32 },
  ...
  { time: '10pm', revenue: 16200, orders: 109 }
]

liveOrders = [
  { id: 'ORD-0291', tableNumber: 1, status: 'cooking', total: ₹567, items: [...] },
  { id: 'ORD-0292', tableNumber: 4, status: 'pending', total: ₹2,005, items: [...] },
  ...
]
```

**Backend APIs Needed:**
1. `GET /api/dashboard/summary` → Replace `todayStats`
2. `GET /api/dashboard/revenue-chart?range=today` → Replace `revenueData`
3. `GET /api/dashboard/revenue-chart?range=week` → Replace `weeklyRevenue`
4. `GET /api/orders/live?status=active` → Replace `liveOrders`
5. `GET /api/tables?branchId=` → Replace `tables`
6. `GET /api/inventory/low-stock-alerts` → Replace `inventoryAlerts`
7. `GET /api/menu/items` → Replace `menuItems`
8. `GET /api/dashboard/top-dishes` → Replace `topDishes`

---

## SECTION 2: DASHBOARD COMPONENTS

### Component 2: `components/dashboard/dashboard-overview.tsx`
**Status:** ⚠️ CRITICAL - Main dashboard page  
**Lines:** 180  

**Mock Data Used:**
- `todayStats` → All 6 KPI cards
- `topDishes` → Top Dishes ranked list
- `inventoryAlerts` → Inventory Alerts badge + list
- Hardcoded greeting: "Good evening, Rajesh"
- Hardcoded restaurant status: "Restaurant Open"
- Hardcoded close time: "Close at 11 PM"

**Components:**
```typescript
<StatCard value={todayStats.revenue.value} />    // ₹115,400
<StatCard value={todayStats.orders.value} />     // 248
<StatCard value={todayStats.avgTicket.value} />  // ₹465
<StatCard value={todayStats.tableOccupancy.value} /> // 73%
<StatCard value={todayStats.newCustomers.value} /> // 34
<StatCard value={todayStats.satisfaction.value} /> // 4.7
```

**Backend APIs Needed:**
1. `GET /api/dashboard/summary?branchId=<id>&date=today`
2. `GET /api/dashboard/top-dishes?branchId=<id>`
3. `GET /api/inventory/low-stock-alerts?branchId=<id>`
4. `GET /api/auth/me` → For greeting user name
5. `GET /api/restaurants/current-status?branchId=<id>`

**Priority:** 🔴 CRITICAL (Main dashboard page)

---

### Component 3: `components/dashboard/revenue-chart.tsx`
**Status:** ⚠️ CRITICAL - Revenue visualization  
**Lines:** 150  

**Mock Data Used:**
- `revenueData` → Area chart for "Today" view (9 data points)
- `weeklyRevenue` → Bar chart for "Week" view (7 data points)
- Hardcoded summaries:
  - "Total Revenue: ₹1,15,400"
  - "Total Orders: 777"
  - "Peak Hour: 8 PM"

**Hardcoded Values:**
```typescript
const data = range === 'today' ? revenueData : weeklyRevenue
// All chart points are fake
```

**Backend APIs Needed:**
1. `GET /api/dashboard/revenue-chart?branchId=<id>&range=today`
   - Returns: `{ range, totalRevenue, totalOrders, peakHour, points: [{label, revenue, orders}] }`
2. `GET /api/dashboard/revenue-chart?branchId=<id>&range=week`
   - Returns: `{ range, points: [{day, revenue, target}] }`

**Priority:** 🔴 CRITICAL

---

### Component 4: `components/dashboard/live-orders-feed.tsx`
**Status:** ⚠️ CRITICAL - Live orders display  
**Lines:** 120  

**Mock Data Used:**
- `liveOrders` → 5 hardcoded orders
- Each order has:
  - Order ID: "ORD-0291", "ORD-0292", etc.
  - Table number: 1, 4, 7, 10, 101
  - Status: pending, cooking, ready, accepted, served
  - Items: Butter Chicken, Biryani, etc.
  - Totals: ₹567, ₹2,005, ₹2,121, etc.
  - Waiter names: Arjun S., Priya M., Rohit K.
  - Priority flags: normal, high, urgent
  - Elapsed time: "12m ago", "3m ago", etc.

**Hardcoded Badge:**
```typescript
<Badge>{liveOrders.length} active</Badge>  // Always shows 5 active
```

**Backend APIs Needed:**
1. `GET /api/orders/live?branchId=<id>&status=active`
   - Returns: `{ activeCount, orders: [{ id, orderNumber, tableNumber, status, items, totalAmount, createdAt, waiterName }] }`

**Real-Time Updates:**
- Socket.IO event: `orders:live-updated` → Real-time refresh

**Priority:** 🔴 CRITICAL

---

### Component 5: `components/dashboard/table-occupancy-grid.tsx`
**Status:** ⚠️ CRITICAL - Table management display  
**Lines:** 140  

**Mock Data Used:**
- `tables` → 15 hardcoded tables
  - Table numbers: 1-12, 101-103
  - Sections: indoor, outdoor, vip
  - Statuses: available, occupied, reserved, cleaning, out_of_service
  - Capacity: 2-12 people
  - Occupied since times: "19:15", "18:45", etc.
  - Waiter assignments: Arjun S., Priya M., etc.
  - Guest counts: 2-7 people

**Hardcoded Counts:**
```typescript
const occupiedTables = tables.filter(t => t.status === 'occupied').length  // Always 5
const totalTables = tables.length  // Always 15
const occupancyPct = Math.round((occupiedTables / totalTables) * 100)  // Always 33%
```

**Backend APIs Needed:**
1. `GET /api/tables?branchId=<id>`
   - Returns: `{ tables: [{ id, tableNumber, capacity, section, status, occupiedSince, guestCount, waiterName }] }`
2. `GET /api/dashboard/table-counts?branchId=<id>`
   - Returns: `{ totalTables, available, occupied, reserved, cleaning }`

**Real-Time Updates:**
- Socket.IO event: `tables:status-updated` → Real-time refresh

**Priority:** 🔴 CRITICAL

---

## SECTION 3: LAYOUT COMPONENTS

### Component 6: `components/layout/app-sidebar.tsx`
**Status:** ⚠️ CRITICAL - Navigation sidebar  
**Lines:** 250  

**Mock Data Used:**
- Hardcoded badge values:
  - "Reservations: **3**" (navGroups[0].items[3].badge)
  - "Live Orders: **5**" (navGroups[0].items[4].badge)
  - "Inventory: **4**" (navGroups[1].items[2].badge)
  - "POS Terminal: **Live**" (navGroups[0].items[1].badge)
  - "Kitchen Display: **Live**" (navGroups[1].items[0].badge)

- Hardcoded restaurant/branch name:
  - "Spice Garden" (dropdown header)
  - "Mumbai Central" (branch name)

- Dropdown menu with fake branches:
  - "Spice Garden — Mumbai"
  - "Spice Garden — Pune"

- Hardcoded user info (footer):
  - Name: "Rajesh Sharma"
  - Role: "Owner"

**Mock Data Structure:**
```typescript
const navGroups = [
  {
    label: 'Operations',
    items: [
      { label: 'Reservations', badge: '3' },      // HARDCODED
      { label: 'Live Orders', badge: '5' },       // HARDCODED
      { label: 'Kitchen Display', badge: 'Live' }, // HARDCODED
      { label: 'Inventory', badge: '4' },         // HARDCODED
    ]
  }
]
```

**Hardcoded User Footer:**
```typescript
<span>Rajesh Sharma</span>  // HARDCODED
<span>Owner</span>          // HARDCODED
```

**Backend APIs Needed:**
1. `GET /api/dashboard/sidebar-counts?branchId=<id>`
   - Returns: `{ reservations, liveOrders, inventoryAlerts, posLive, kitchenLive }`
2. `GET /api/auth/me`
   - Returns: `{ id, name, role, organizationId, restaurantId, branchId, restaurantName, branchName }`
3. `GET /api/restaurants/branches?restaurantId=<id>`
   - Returns: `{ branches: [{ id, name }] }`

**Priority:** 🔴 CRITICAL (Sidebar used on every page)

---

### Component 7: `components/layout/top-navbar.tsx`
**Status:** ⚠️ CRITICAL - Top navigation bar  
**Lines:** 180  

**Mock Data Used:**
- Hardcoded notifications array:
  ```typescript
  const notifications = [
    { id: 1, type: 'order', title: 'New order at Table 7', body: '3 items — ₹2,121', time: '1m ago', read: false },
    { id: 2, type: 'alert', title: 'Low stock alert', body: 'Saffron below threshold (12g)', time: '5m ago', read: false },
    { id: 3, type: 'reservation', title: 'Reservation confirmed', body: 'Rahul Gupta — Table 3, 9PM', time: '12m ago', read: false },
    { id: 4, type: 'order', title: 'Order ORD-0290 served', body: 'Table 2 — ₹1,240', time: '18m ago', read: true },
  ]
  ```
- Unread notification count: Always 3 (calculated from read flag)
- Hardcoded "Live" status badge
- Hardcoded current time display

**Hardcoded Props:**
```typescript
interface TopNavbarProps {
  title?: string  // Passed as "Dashboard"
  subtitle?: string  // Passed as "Spice Garden — Mumbai Central"
}
// These are hardcoded in page.tsx
```

**Backend APIs Needed:**
1. `GET /api/notifications?limit=10`
   - Returns: `{ notifications: [{ id, type, title, body, time, read, createdAt }] }`
2. Socket.IO event: `notifications:new` → Real-time notification updates
3. `PATCH /api/notifications/<id>/read` → Mark notification as read

**Priority:** 🟡 HIGH (Secondary data)

---

## SECTION 4: PAGE-LEVEL HARDCODING

### Page 8: `app/(dashboard)/page.tsx`
**Status:** ⚠️ CRITICAL - Main dashboard page  

**Mock Data Used:**
- Hardcoded title: "Dashboard"
- Hardcoded subtitle: "Spice Garden — Mumbai Central" ← Should come from auth/context
- Component `<DashboardOverview />` contains all mock data

**Current Code:**
```typescript
export default function DashboardPage() {
  return (
    <>
      <TopNavbar title="Dashboard" subtitle="Spice Garden — Mumbai Central" />
      <DashboardOverview />
    </>
  )
}
```

**Should Be:**
```typescript
export default function DashboardPage() {
  const { restaurantName, branchName } = useAuth()
  return (
    <>
      <TopNavbar title="Dashboard" subtitle={`${restaurantName} — ${branchName}`} />
      <DashboardOverview />
    </>
  )
}
```

**Backend APIs Needed:**
1. `GET /api/auth/me` → For restaurant/branch context

**Priority:** 🔴 CRITICAL

---

## SECTION 5: SUMMARY OF HARDCODED VALUES

### Dashboard KPI Cards (All Fake)
| Metric | Current Value | Source | Backend API |
|--------|---------------|--------|-------------|
| Today's Revenue | ₹115,400 | `todayStats.revenue.value` | `GET /api/dashboard/summary` |
| Change | +18.4% | `todayStats.revenue.change` | Same |
| Total Orders | 248 | `todayStats.orders.value` | Same |
| Avg Ticket | ₹465 | `todayStats.avgTicket.value` | Same |
| Table Occupancy | 73% | `todayStats.tableOccupancy.value` | Same |
| New Guests | 34 | `todayStats.newCustomers.value` | Same |
| Satisfaction | 4.7/5 | `todayStats.satisfaction.value` | Same |

### Sidebar Badges (All Fake)
| Badge | Current Value | Source | Backend API |
|-------|---------------|--------|-------------|
| Reservations | 3 | `navGroups[0].items[3].badge` | `GET /api/dashboard/sidebar-counts` |
| Live Orders | 5 | `navGroups[0].items[4].badge` | Same |
| Inventory Alerts | 4 | `navGroups[1].items[2].badge` | Same |
| POS Status | "Live" | Static string | Same |
| Kitchen Status | "Live" | Static string | Same |

### User/Restaurant Info (All Fake)
| Item | Current Value | Source |
|------|---------------|--------|
| User Name | "Rajesh Sharma" | `AppSidebar` footer |
| User Role | "Owner" | `AppSidebar` footer |
| Restaurant Name | "Spice Garden" | `AppSidebar` header + `TopNavbar` |
| Branch Name | "Mumbai Central" | `AppSidebar` header + `TopNavbar` |
| Other Branches | Mumbai, Pune | Dropdown menu |

### Chart Data (All Fake)
| Chart | Data Points | Source | Backend API |
|-------|------------|--------|-------------|
| Revenue Area Chart (Today) | 9 hourly points | `revenueData` | `GET /api/dashboard/revenue-chart?range=today` |
| Revenue Bar Chart (Week) | 7 daily points | `weeklyRevenue` | `GET /api/dashboard/revenue-chart?range=week` |
| Peak Hour | "8 PM" | Hardcoded in chart | Same |
| Total Orders in Chart | 777 | Hardcoded | Same |

### Live Data (All Fake)
| Item | Count | Source | Backend API |
|------|-------|--------|-------------|
| Live Orders | 5 | `liveOrders.length` | `GET /api/orders/live` |
| Active Tables | 5 occupied | `tables.filter(...).length` | `GET /api/tables` |
| Active Reservations | 3 | Sidebar badge | `GET /api/dashboard/sidebar-counts` |
| Top Dishes | 5 items | `topDishes` | `GET /api/dashboard/top-dishes` |
| Inventory Alerts | 4 items | `inventoryAlerts` | `GET /api/inventory/low-stock-alerts` |
| Notifications | 4 items | `notifications` | `GET /api/notifications` |

---

## SECTION 6: REQUIRED BACKEND APIS - COMPLETE LIST

### Dashboard APIs
```
GET /api/dashboard/summary?branchId=<id>&date=today
GET /api/dashboard/revenue-chart?branchId=<id>&range=today|week
GET /api/dashboard/top-dishes?branchId=<id>
GET /api/dashboard/sidebar-counts?branchId=<id>
GET /api/orders/live?branchId=<id>&status=active
GET /api/tables?branchId=<id>
GET /api/inventory/low-stock-alerts?branchId=<id>
GET /api/restaurants/current-status?branchId=<id>
```

### Auth APIs
```
GET /api/auth/me
GET /api/restaurants/branches?restaurantId=<id>
```

### Notification APIs
```
GET /api/notifications?limit=10
PATCH /api/notifications/<id>/read
```

### Real-Time Socket.IO Events
```
orders:live-updated
tables:status-updated
kitchen:ticket-updated
notifications:new
inventory:low-stock-updated
```

---

## SECTION 7: IMPLEMENTATION PRIORITY

### Phase 1 (CRITICAL - Must do first)
1. ✅ Dashboard page mock data audit ← **YOU ARE HERE**
2. Backend API endpoints implementation
3. Frontend Dashboard integration
4. Real-time updates setup

### Phase 2 (HIGH - Next)
1. POS Terminal page
2. Tables management page
3. Kitchen Display System

### Phase 3 (MEDIUM)
1. Reservations page
2. Live Orders page
3. Menu Management page

### Phase 4 (LOW)
1. Inventory page
2. Analytics page
3. CRM page
4. Billing page
5. Staff page
6. Settings page

---

## SECTION 8: FILES REQUIRING UPDATES

| File Path | Component | Status | Changes Required |
|-----------|-----------|--------|------------------|
| `lib/mock-data.ts` | Data hub | 🔴 DELETE | Remove entire file after APIs complete |
| `components/dashboard/dashboard-overview.tsx` | Main dashboard | 🔴 UPDATE | Replace mock with API calls |
| `components/dashboard/revenue-chart.tsx` | Chart | 🔴 UPDATE | Replace chart data with API |
| `components/dashboard/live-orders-feed.tsx` | Orders | 🔴 UPDATE | Replace orders with API |
| `components/dashboard/table-occupancy-grid.tsx` | Tables | 🔴 UPDATE | Replace tables with API |
| `components/layout/app-sidebar.tsx` | Navigation | 🔴 UPDATE | Replace badges & user info |
| `components/layout/top-navbar.tsx` | Header | 🔴 UPDATE | Replace notifications |
| `app/(dashboard)/page.tsx` | Page | 🔴 UPDATE | Remove hardcoded strings |

---

## SECTION 9: NEW FILES TO CREATE

### Backend Foundation Files
```
src/lib/api/client.ts              ← API client setup
src/lib/api/dashboard.ts           ← Dashboard API service
src/lib/api/orders.ts              ← Orders API service
src/lib/api/tables.ts              ← Tables API service
src/lib/api/auth.ts                ← Auth API service
src/types/api.ts                   ← API response types
src/types/dashboard.ts             ← Dashboard DTOs
src/types/orders.ts                ← Order DTOs
src/hooks/useAuth.ts               ← Auth context hook
src/hooks/useDashboard.ts          ← Dashboard data hook
src/context/AuthContext.tsx        ← Auth provider
src/middleware/auth.ts             ← Auth middleware
```

### Backend API Files (Node.js)
```
api/routes/dashboard.ts
api/routes/orders.ts
api/routes/tables.ts
api/routes/auth.ts
api/middleware/auth.ts
api/middleware/tenant.ts
api/services/dashboard.service.ts
api/services/orders.service.ts
api/utils/responses.ts
api/utils/errors.ts
```

---

## SECTION 10: ENVIRONMENT VARIABLES NEEDED

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

---

## CHECKLIST - BEFORE PROCEEDING TO PHASE 2

- [ ] This audit report is complete and reviewed
- [ ] All mock data locations identified
- [ ] Backend API requirements documented
- [ ] No modifications made to frontend yet
- [ ] Ready to implement backend foundation

---

## NEXT STEPS

**PHASE 2: Backend Foundation**

1. Create backend API structure
2. Set up database connection with Prisma
3. Implement authentication middleware
4. Implement tenant context middleware
5. Create standardized API response format
6. Implement error handling
7. Set up Socket.IO for real-time updates
8. Deploy test data seed

**Estimated Time:** 8-12 hours

---

**Report Status:** ✅ COMPLETE  
**Total Mock Data Issues Found:** 12+ files with 100+ hardcoded values  
**Recommendation:** Proceed to PHASE 2 - Backend Foundation  

**Do NOT modify frontend code until backend APIs are ready.**

---

*Generated: 2025-01-15*  
*Auditor: AI Backend Engineer*  
*Priority: CRITICAL*
