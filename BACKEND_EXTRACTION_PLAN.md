# 🔧 BACKEND EXTRACTION PLAN
## Splitting Monolithic Next.js into Independent Frontend + Backend Applications

**Status:** PLANNING PHASE (Awaiting Approval - No Implementation)
**Objective:** Split one working full-stack Next.js app into two independent applications
**Constraint:** Frontend communicates with Backend over HTTP (preserve all current functionality)
**Scope:** No Firebase, no mock data, no business logic changes, no API replacement

---

## EXECUTIVE SUMMARY

**Current State:** Monolithic Next.js app with embedded backend
```
Restaurant-management-master/
├── app/              ← Next.js pages & layouts
├── api/              ← Backend services (Prisma)
├── app/api/          ← 25 HTTP route handlers
├── components/       ← React UI components
├── hooks/            ← React data hooks
├── lib/              ← Utilities & API client
├── prisma/           ← Database schema
└── package.json      ← All dependencies mixed
```

**Target State:** Two Independent Applications
```
restaurant-backend/
├── src/
│   ├── api/          ← Backend services moved from api/
│   ├── routes/       ← HTTP routes from app/api/
│   ├── middleware/   ← Auth, tenant, error handling
│   ├── utils/        ← Response/error formatters
│   └── index.ts      ← Express/Hono server
├── prisma/           ← Database schema (shared access)
├── package.json      ← Backend-only dependencies
└── .env              ← Database URL, secrets

restaurant-frontend/
├── app/              ← Next.js pages (unchanged)
├── components/       ← React UI (unchanged)
├── hooks/            ← Data hooks (modified for HTTP)
├── lib/
│   ├── api/          ← HTTP client (NEW - points to backend)
│   ├── utils.ts      ← UI utilities
│   └── store.ts      ← Zustand state
├── types/            ← TypeScript types (unchanged)
├── public/           ← Static assets
├── package.json      ← Frontend-only dependencies
├── next.config.mjs   ← Next.js config
└── .env.local        ← NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

**Key Principle:** Frontend calls Backend over HTTP exactly like it calls its own `/api` routes today.

---

## PART 1: IDENTIFICATION PHASE

### 1.1 Backend Files That Must Move

#### API Routes (25 files in `app/api/`)

All Next.js route handlers that directly access Prisma/database:

**Authentication:**
- `app/api/auth/me/route.ts` - Get current user

**Dashboard:**
- `app/api/dashboard/summary/route.ts`
- `app/api/dashboard/revenue-chart/route.ts`
- `app/api/dashboard/sidebar-counts/route.ts`

**Orders:**
- `app/api/orders/route.ts`
- `app/api/orders/live/route.ts`
- `app/api/orders/[id]/send-to-kitchen/route.ts`

**Menu:**
- `app/api/menu/items/route.ts`
- `app/api/pos/menu/route.ts`

**POS:**
- `app/api/pos/tables/route.ts`
- `app/api/pos/customers/route.ts`
- `app/api/pos/customers/search/route.ts`

**Tables & Reservations:**
- `app/api/tables/route.ts`
- `app/api/reservations/route.ts`

**CRM:**
- `app/api/crm/customers/route.ts`

**Billing & Payments:**
- `app/api/billing/invoices/route.ts`
- `app/api/bills/route.ts`
- `app/api/payments/route.ts`
- `app/api/payments/razorpay/verify/route.ts`
- `app/api/payments/razorpay/create-order/route.ts`
- `app/api/payments/razorpay/webhook/route.ts`

**Inventory:**
- `app/api/inventory/items/route.ts`

**Notifications & Staff:**
- `app/api/notifications/route.ts`
- `app/api/restaurants/current-status/route.ts`
- `app/api/staff/route.ts`

#### Backend Services (8 files in `api/`)

**Core Services:**
- `api/services/auth.service.ts` - User authentication via Prisma
- `api/services/dashboard.service.ts` - Dashboard metrics via Prisma
- `api/services/orders.service.ts` - Order queries via Prisma
- `api/services/pos.orders.service.ts` - POS order creation via Prisma
- `api/services/tables.service.ts` - Table management via Prisma

**Middleware:**
- `api/middleware/auth.ts` - Authentication context extraction
- `api/middleware/tenant.ts` - Tenant/organization context

**Utilities:**
- `api/utils/responses.ts` - Response/error formatting
- `api/utils/errors.ts` - Custom error classes

#### Database Files

- `prisma/schema.prisma` - Complete database schema
- `prisma/migrations/` - Database migration history (if exists)

#### Dependencies to Move

```json
{
  "@prisma/client": "^5.8.0"
}
```

**Summary:** 25 route handlers + 8 backend services + Prisma = **33 backend files**

---

### 1.2 Frontend Files That Depend on Backend

#### Frontend API Client (4 files in `lib/api/`)

These call the backend HTTP endpoints:
- `lib/api/client.ts` - HTTP client (fetch wrapper)
- `lib/api/auth.ts` - Auth API calls
- `lib/api/dashboard.ts` - Dashboard API calls
- `lib/api/orders.ts` - Orders API calls

**Current Behavior:**
```typescript
// lib/api/client.ts
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  return fetch(`/api${endpoint}`, options)  // Calls local /api/
}

// lib/api/dashboard.ts
export const getDashboardSummary = async (branchId: string) => {
  return apiCall('/dashboard/summary', { params: { branchId } })
}
```

**After Extraction:**
```typescript
// lib/api/client.ts - CHANGE: Point to backend server
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiCall = async (endpoint: string, options?: RequestInit) => {
  return fetch(`${API_BASE}/api${endpoint}`, options)  // Calls backend
}

// Rest stays the same - same function signatures
```

#### Frontend Data Hooks (18 files in `hooks/`)

These use the API client to fetch data:

**Authentication:**
- `hooks/useAuth.ts` - User authentication
- `hooks/useAuthContext.ts` - Auth context provider

**Dashboard:**
- `hooks/useDashboardSummary.ts`
- `hooks/useRevenueChart.ts`
- `hooks/useSidebarCounts.ts`
- `hooks/useRestaurantStatus.ts`

**Orders:**
- `hooks/useLiveOrders.ts`
- `hooks/useMenuItems.ts`

**Tables & Reservations:**
- `hooks/useTables.ts`
- `hooks/useReservations.ts`

**POS:**
- `hooks/usePOS.ts`

**CRM:**
- `hooks/useCRMCustomers.ts`

**Billing:**
- `hooks/useBillingInvoices.ts`

**Inventory:**
- `hooks/useInventoryItems.ts`

**Notifications:**
- `hooks/useNotifications.ts`

**Staff:**
- `hooks/useStaff.ts`

**Payments:**
- `hooks/useRazorpay.ts`

**Utility:**
- `hooks/use-mobile.ts` - Mobile device detection (no API call)

**Change Required:** Update all 18 hooks to use the new backend HTTP endpoint
- No function signature changes
- No data structure changes
- Only the fetch source changes

### 1.3 Shared Files That Remain in BOTH Projects

#### TypeScript Type Definitions

These are used by both frontend and backend:
- `types/api.ts` - API response types
- `types/auth.ts` - User/auth types
- `types/dashboard.ts` - Dashboard metrics types
- `types/notifications.ts` - Notification types
- `types/orders.ts` - Order types

**Strategy:** Share via symlink OR duplicate OR monorepo package
```
Option A: Symlink from backend to frontend/types
  restaurant-backend/src/types → ../../restaurant-frontend/types

Option B: Create shared package
  packages/types/
  ├── src/
  │   ├── api.ts
  │   ├── auth.ts
  │   ├── dashboard.ts
  │   ├── orders.ts
  │   └── notifications.ts
  └── package.json

Option C: Duplicate types in both projects (simplest for initial split)
  restaurant-backend/src/types/ (copied from frontend)
  restaurant-frontend/types/ (unchanged)
```

**Recommendation:** Use Option C (duplicate) for first split, migrate to monorepo later

---

### 1.4 Environment-Specific Changes

#### Frontend Environment Variables

**Current (.env in root):**
```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
```

**After Extraction (frontend/.env.local):**
```
# Remove database URLs - frontend doesn't need them
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

#### Backend Environment Variables

**New (backend/.env):**
```
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/rms"
DIRECT_URL="postgresql://user:pass@localhost:5432/rms"

# Server
PORT=8000
NODE_ENV="development"

# Auth/Security
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:3000"

# Optional (Razorpay, etc.)
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."
```

---

## PART 2: COMMUNICATION ARCHITECTURE

### 2.1 Current Architecture (Monolithic)

```
Browser Request
    ↓
Next.js Server (Port 3000)
    ├── Serves UI (React components)
    └── Handles /api/* routes
        ├── Routes call services
        ├── Services query Prisma
        └── Prisma queries PostgreSQL
```

**Issue:** Frontend and backend tightly coupled in same process

### 2.2 Target Architecture (Split)

```
Browser Request
    ↓
Next.js Frontend (Port 3000)
    ├── Serves UI (React components)
    └── Frontend makes HTTP calls to backend
        ↓
Backend Server (Port 8000)
    ├── Exposes /api/* HTTP endpoints
    ├── Routes call services
    ├── Services query Prisma
    └── Prisma queries PostgreSQL
```

**Key:** Frontend calls backend via HTTP, not internal functions

### 2.3 HTTP Communication Flow

**Example: Dashboard Summary**

**Current (Monolithic):**
```typescript
// Frontend hook
const { data } = useDashboardSummary(branchId)
  └─→ getDashboardSummary(branchId)
      └─→ fetch('/api/dashboard/summary?branchId=xxx')
          └─→ Backend route handler (same Next.js instance)
              └─→ dashboardService.getDashboardSummary()
                  └─→ Prisma query
                      └─→ PostgreSQL response
```

**After Extraction:**
```typescript
// Frontend hook (UNCHANGED function call)
const { data } = useDashboardSummary(branchId)
  └─→ getDashboardSummary(branchId)
      └─→ fetch('http://localhost:8000/api/dashboard/summary?branchId=xxx')
          └─→ Backend server instance
              └─→ Backend route handler
                  └─→ dashboardService.getDashboardSummary()
                      └─→ Prisma query
                          └─→ PostgreSQL response
```

**Result:** Frontend code doesn't change, only the base URL changes

---

## PART 3: FINAL FOLDER STRUCTURE

### 3.1 Backend Project Structure

```
restaurant-backend/
├── src/
│   ├── api/                          ← Moved from root api/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── tenant.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── pos.orders.service.ts
│   │   │   └── tables.service.ts
│   │   └── utils/
│   │       ├── responses.ts
│   │       └── errors.ts
│   │
│   ├── routes/                       ← Converted from app/api/
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── orders.ts
│   │   ├── menu.ts
│   │   ├── pos.ts
│   │   ├── tables.ts
│   │   ├── reservations.ts
│   │   ├── crm.ts
│   │   ├── billing.ts
│   │   ├── payments.ts
│   │   ├── inventory.ts
│   │   ├── notifications.ts
│   │   ├── restaurants.ts
│   │   └── staff.ts
│   │
│   ├── types/                        ← Copied from frontend/types/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── notifications.ts
│   │   └── orders.ts
│   │
│   └── index.ts                      ← Express/Hono server entry point
│
├── prisma/                           ← Copied from root prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── package.json                      ← Backend dependencies only
├── tsconfig.json
├── .env                              ← Database URL, secrets
└── .gitignore
```

### 3.2 Frontend Project Structure

```
restaurant-frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── analytics/
│   │   ├── billing/
│   │   ├── crm/
│   │   ├── inventory/
│   │   ├── kitchen/
│   │   ├── menu/
│   │   ├── orders/
│   │   ├── pos/
│   │   ├── reservations/
│   │   ├── settings/
│   │   ├── staff/
│   │   ├── tables/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                          ← REMOVED (all backend)
│   ├── globals.css
│   └── layout.tsx
│
├── components/                       ← UNCHANGED
│   ├── analytics/
│   ├── billing/
│   ├── crm/
│   ├── dashboard/
│   ├── inventory/
│   ├── kitchen/
│   ├── layout/
│   ├── menu/
│   ├── orders/
│   ├── pos/
│   ├── reservations/
│   ├── settings/
│   ├── staff/
│   ├── tables/
│   └── ui/
│
├── hooks/                            ← Modified for HTTP calls
│   ├── useAuth.ts
│   ├── useAuthContext.ts
│   ├── useBillingInvoices.ts
│   ├── useCRMCustomers.ts
│   ├── useDashboardSummary.ts
│   ├── useInventoryItems.ts
│   ├── useLiveOrders.ts
│   ├── useMenuItems.ts
│   ├── useNotifications.ts
│   ├── usePOS.ts
│   ├── useRazorpay.ts
│   ├── useReservations.ts
│   ├── useRestaurantStatus.ts
│   ├── useRevenueChart.ts
│   ├── useSidebarCounts.ts
│   ├── useStaff.ts
│   ├── useTables.ts
│   └── use-mobile.ts
│
├── lib/
│   ├── api/                          ← Modified to point to backend
│   │   ├── client.ts                 (CHANGE: API_BASE URL)
│   │   ├── auth.ts                   (UNCHANGED: same functions)
│   │   ├── dashboard.ts              (UNCHANGED: same functions)
│   │   └── orders.ts                 (UNCHANGED: same functions)
│   ├── utils.ts                      ← UNCHANGED
│   ├── store.ts                      ← UNCHANGED
│   ├── razorpay.ts                   ← UNCHANGED
│   └── mock-data.ts                  ← UNCHANGED (optional)
│
├── types/
│   ├── api.ts
│   ├── auth.ts
│   ├── dashboard.ts
│   ├── notifications.ts
│   └── orders.ts
│
├── public/                           ← UNCHANGED
│   ├── apple-icon.png
│   ├── icon-*.png
│   ├── placeholder-*.svg
│   └── etc.
│
├── next.config.mjs                   ← UNCHANGED
├── tsconfig.json                     ← UNCHANGED
├── postcss.config.mjs                ← UNCHANGED
├── components.json                   ← UNCHANGED (shadcn config)
├── next-env.d.ts                     ← UNCHANGED
├── package.json                      ← Remove @prisma/client
├── .env.local                        ← NEXT_PUBLIC_API_URL
└── .gitignore                        ← UNCHANGED
```

### 3.3 Monorepo Option (Future)

```
restaurant-management-monorepo/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   ├── prisma/
│   │   └── package.json
│   │
│   └── frontend/
│       ├── app/
│       ├── components/
│       └── package.json
│
├── packages/
│   ├── types/                        ← Shared type definitions
│   │   ├── src/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── etc.
│   │   └── package.json
│   │
│   └── api-client/                   ← Shared HTTP client
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── pnpm-workspace.yaml
└── package.json (root)
```

---

## PART 4: CHANGES REQUIRED

### 4.1 API Client Changes (Frontend)

**File: `frontend/lib/api/client.ts`**

```typescript
// CHANGE: Add backend URL configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Current implementation (stays the same, just different base)
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE}/api${endpoint}`
  const response = await fetch(url, {
    ...options,
    credentials: 'include'  // For cookies/auth
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  
  return response.json()
}
```

**Impact:** Only the `API_BASE` changes, all other functions remain identical

### 4.2 Hook Changes (Frontend)

**No function signature changes required** - only internal fetch sources

Example (no changes to function interface):
```typescript
// BEFORE
export function useDashboardSummary(branchId: string | null) {
  const { data, loading, error } = ...
  return { data, loading, error, refetch }
}

// AFTER (interface identical, just uses new API_BASE)
export function useDashboardSummary(branchId: string | null) {
  const { data, loading, error } = ...
  return { data, loading, error, refetch }
}
```

### 4.3 Backend Route Conversion

**From Next.js Route Handler to Express/Hono:**

```typescript
// BEFORE (Next.js Route Handler: app/api/dashboard/summary/route.ts)
import { getDashboardSummary } from '@/api/services/dashboard.service'
import { successResponse } from '@/api/utils/responses'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get('branchId')
  
  const data = await getDashboardSummary(branchId)
  return Response.json(successResponse(data))
}

// AFTER (Express/Hono: backend/src/routes/dashboard.ts)
import { Router } from 'express'  // or hono
import { getDashboardSummary } from '../api/services/dashboard.service'
import { successResponse } from '../api/utils/responses'

const router = Router()

router.get('/summary', async (req, res) => {
  const { branchId } = req.query
  
  const data = await getDashboardSummary(branchId)
  res.json(successResponse(data))
})

export default router
```

### 4.4 Middleware Adaptation

**Authentication Middleware:**

```typescript
// BEFORE (Next.js req/res in app/api)
export const extractAuthContext = (req: any): AuthContext => {
  const token = req.headers.authorization?.split(' ')[1]
  // ... extract user from token
}

// AFTER (Express req/res in backend)
export const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  req.authContext = extractAuthContext(req)
  next()
}
```

### 4.5 Package.json Changes

**Frontend - Remove Backend Dependencies:**

```json
// REMOVE:
"@prisma/client": "^5.8.0"

// KEEP:
"next": "^16.2.6",
"react": "^19",
"react-dom": "^19",
"tailwindcss": "^4.2.0",
"zustand": "^5.0.14",
// ... all UI/frontend packages
```

**Backend - Add Server Dependencies:**

```json
{
  "name": "restaurant-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",      // Or hono: "^4.0.0"
    "@prisma/client": "^5.8.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0"
  }
}
```

---

## PART 5: EXTRACTION ORDER (Safe Progression)

### Step 1: Create Backend Project Structure

**Goal:** Set up backend project with all backend files

**Action:**
1. Create `restaurant-backend/` directory in parallel
2. Copy `api/` → `backend/src/api/`
3. Copy `prisma/` → `backend/prisma/`
4. Copy `types/` → `backend/src/types/`
5. Create `backend/src/routes/` (empty, for conversion)
6. Create `backend/src/index.ts` (Express/Hono entry point)

**Result:** Backend structure ready, but no routes yet

---

### Step 2: Convert Routes to Express/Hono

**Goal:** Convert 25 Next.js route handlers to Express/Hono endpoints

**Action:**
1. Iterate through each `app/api/*/route.ts` file
2. Extract route logic into `backend/src/routes/*.ts`
3. Convert Next.js request/response to Express format
4. Maintain identical business logic

**Example Conversion:**
```
app/api/dashboard/summary/route.ts 
  → backend/src/routes/dashboard.ts (GET /api/dashboard/summary)

app/api/orders/route.ts 
  → backend/src/routes/orders.ts (GET/POST /api/orders)

app/api/payments/razorpay/webhook/route.ts 
  → backend/src/routes/payments.ts (POST /api/payments/razorpay/webhook)
```

**Result:** All routes running in backend server

---

### Step 3: Update Frontend API Client

**Goal:** Point frontend HTTP calls to backend server

**Action:**
1. Update `frontend/lib/api/client.ts` - change `API_BASE` to backend URL
2. Add `.env.local` with `NEXT_PUBLIC_API_URL="http://localhost:8000"`
3. No changes to API call functions (same signatures)

**Result:** Frontend still compiles, calls to backend instead of local `/api/`

---

### Step 4: Update Frontend Hooks

**Goal:** Ensure hooks use new API client

**Action:**
1. Verify all 18 hooks import from `@/lib/api/`
2. No code changes needed - they automatically use new API_BASE
3. Test that hooks receive data

**Result:** All hooks receive data from backend

---

### Step 5: Clean Frontend Dependencies

**Goal:** Remove backend dependencies from frontend

**Action:**
1. Remove `@prisma/client` from `frontend/package.json`
2. Remove `api/` and `app/api/` directories from frontend
3. Run `npm install` in frontend

**Result:** Frontend is pure UI-only

---

### Step 6: Verify Both Applications

**Goal:** Ensure complete functionality

**Action:**
1. Start backend: `cd backend && npm run dev` (port 8000)
2. Start frontend: `cd frontend && npm run dev` (port 3000)
3. Test all pages load
4. Test all API calls work
5. Test auth flows
6. Test data submission

**Result:** Complete separation, both apps working

---

### Step 7: Finalize Project Structure

**Goal:** Clean up monorepo into two separate projects

**Action:**
1. Separate git repositories (optional) OR keep as monorepo with workspaces
2. Update root package.json with workspace scripts
3. Create backend/.gitignore
4. Create backend/README.md
5. Create frontend/README.md

**Result:** Two independent, deployable applications

---

## PART 6: VERIFICATION CHECKLIST

### Before Starting

- [ ] All code committed to git
- [ ] Create backup branch: `git branch backup-before-split`
- [ ] Test current app works end-to-end

### Backend Extraction

- [ ] Backend project structure created
- [ ] All 25 routes converted to Express/Hono
- [ ] All 8 services copied and tested
- [ ] Prisma schema copied
- [ ] Database connection verified
- [ ] Backend starts on port 8000 without errors
- [ ] All endpoints respond correctly

### Frontend Extraction

- [ ] API client points to backend URL
- [ ] No import errors in frontend
- [ ] No "@prisma/client" imports remain
- [ ] All hooks receive data from backend
- [ ] Frontend builds successfully
- [ ] Frontend starts on port 3000 without errors

### Integration Testing

- [ ] Dashboard displays real data from backend
- [ ] Orders page shows live orders from backend
- [ ] Auth flow works (login/logout)
- [ ] Create order works end-to-end
- [ ] Update order status works
- [ ] Menu management works
- [ ] Tables/reservations work
- [ ] Payments/billing work
- [ ] All pages load without 404 or 500 errors

### Performance

- [ ] Frontend build time < 60 seconds
- [ ] Backend starts < 5 seconds
- [ ] API responses < 500ms (normal conditions)
- [ ] No memory leaks observed

---

## PART 7: DEPENDENCY MAPPING

### Services That Will Move to Backend

| Service | Location | Dependencies |
|---------|----------|--------------|
| getDashboardSummary | api/services/dashboard.service.ts | Prisma, date-fns |
| getRevenueChartToday | api/services/dashboard.service.ts | Prisma, date-fns |
| getLiveOrders | api/services/orders.service.ts | Prisma |
| getOrderById | api/services/orders.service.ts | Prisma |
| generateOrderNumber | api/services/pos.orders.service.ts | Prisma |
| calculateOrderTotals | api/services/pos.orders.service.ts | Math operations |
| getTablesByBranch | api/services/tables.service.ts | Prisma |
| getTableCounts | api/services/tables.service.ts | Prisma |
| getCurrentUserContext | api/services/auth.service.ts | Prisma, JWT |
| validateToken | api/services/auth.service.ts | JWT |
| loginUser | api/services/auth.service.ts | Prisma, bcrypt |

### Frontend Dependencies That Will Stay

| Package | Purpose | Will Use |
|---------|---------|----------|
| next | React framework | Yes |
| react | UI library | Yes |
| react-dom | React DOM | Yes |
| zustand | State management | Yes |
| tailwindcss | Styling | Yes |
| framer-motion | Animations | Yes |
| recharts | Charts | Yes |
| lucide-react | Icons | Yes |
| date-fns | Date formatting | Yes |

### Backend Dependencies That Will Be Added

| Package | Purpose |
|---------|---------|
| express | HTTP server |
| cors | Cross-origin requests |
| dotenv | Environment variables |
| tsx | TypeScript execution |
| @prisma/client | Database ORM |
| jsonwebtoken | Authentication |
| bcryptjs | Password hashing |

---

## PART 8: COMMUNICATION PROTOCOL

### Request Format (Unchanged)

```
GET /api/dashboard/summary?branchId=123
Authorization: Bearer <token>
Content-Type: application/json

Response:
{
  "success": true,
  "data": {
    "totalRevenue": 50000,
    "totalOrders": 250,
    ...
  }
}
```

### Error Handling

**Same error responses from backend:**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

### Authentication

**Token-based (JWT in Authorization header):**

```
Frontend Request:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Backend validates:
  Extracts token from header
  Verifies JWT signature
  Extracts user context
  Passes to route handler
```

### CORS Configuration

**Backend CORS setup:**

```typescript
const cors = require('cors')

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

---

## PART 9: DEPLOYMENT CONSIDERATIONS

### Development Environment

```bash
# Terminal 1: Backend
cd restaurant-backend
npm install
npm run dev
# Listens on http://localhost:8000

# Terminal 2: Frontend
cd restaurant-frontend
npm install
npm run dev
# Listens on http://localhost:3000
# Calls backend at http://localhost:8000
```

### Production Environment

```bash
# Backend deployment
npm run build
npm start
# Listens on process.env.PORT (default 8000)

# Frontend deployment
npm run build
npm start
# Environment variable NEXT_PUBLIC_API_URL=https://api.restaurant.com
```

### Environment Variables

**Frontend (.env.local or .env.production):**
```
NEXT_PUBLIC_API_URL=https://api.restaurant.com
```

**Backend (.env):**
```
DATABASE_URL=postgresql://...
PORT=8000
CORS_ORIGIN=https://restaurant.com
JWT_SECRET=...
```

---

## PART 10: RISK ANALYSIS

### Low Risk ✅

- Moving files and directories (Git preserves history)
- Copying Prisma schema to backend
- Creating new Express/Hono routes (no logic changes)
- Updating API client base URL (single change point)

### Medium Risk ⚠️

- Converting 25 Next.js routes to Express (careful testing needed)
- CORS configuration (ensure frontend can call backend)
- Token/auth validation in backend (test all auth flows)
- Database connection from new location (verify connection string)

### Handled by Plan 🛡️

- No code deletion (all code moved)
- No business logic changes (routes converted line-by-line)
- No API changes (same endpoints, same responses)
- No mock data creation (real data flows through)
- No Firebase implementation (Phase 2)

---

## PART 11: ROLLBACK PLAN

If critical issues arise, rollback options:

### Option A: Git Rollback
```bash
git reset --hard <commit-before-split>
git branch -D backup-before-migration
```

### Option B: Manual Restore
```bash
# Move files back to monolithic structure
mv backend/src/api ./api
mv backend/src/routes/*/route.ts ./app/api/
# Restore package.json with @prisma/client
```

### Option C: Keep Both
```bash
# Keep both structures temporarily
# Gradually migrate features from monolithic to split
```

---

## PART 12: SUCCESS CRITERIA

### Backend Success ✅

1. Backend server starts without errors
2. All 25 endpoints respond correctly
3. All database queries execute successfully
4. Authentication works (JWT validation)
5. CORS allows frontend requests
6. Error handling returns proper responses
7. All business logic preserved

### Frontend Success ✅

1. Frontend builds without "@prisma/client" errors
2. Frontend starts without errors
3. All pages load successfully
4. All data hooks receive data from backend
5. All API calls succeed
6. Auth flows work (login/logout)
7. Form submissions succeed
8. No console errors

### Integration Success ✅

1. Browser → Frontend → Backend → Database flow works
2. All features function end-to-end
3. Performance acceptable (< 500ms responses)
4. No data corruption
5. No missing functionality

---

## PART 13: SUMMARY TABLE

| Component | Current | Target | Changes | Effort |
|-----------|---------|--------|---------|--------|
| Backend files | In root | In backend/ | Move + convert | Medium |
| Frontend files | In root | In frontend/ | No changes | Low |
| API client | Internal routes | HTTP endpoints | Update base URL | Low |
| Hooks | Use internal routes | Use HTTP | No changes | None |
| Database | Root prisma/ | Backend prisma/ | Copy | Low |
| Types | Root types/ | Both projects | Duplicate | Low |
| Dependencies | Mixed | Separated | Split package.json | Low |
| Deployment | Single port 3000 | Two ports (3000, 8000) | New setup | Medium |

**Total Effort:** ~2-4 days for initial extraction
**Complexity:** Medium (file organization + route conversion)
**Risk Level:** Low (all code preserved, no deletion)

---

## STATUS

🟡 **PLANNING COMPLETE - AWAITING APPROVAL**

**Ready to Proceed When Approved:**

1. Create backend project structure
2. Convert routes to Express/Hono
3. Update frontend API client
4. Test both applications
5. Verify all functionality

**Do Not Proceed Until Approved Because:**
- Major project reorganization
- Multiple files moved
- API communication changes
- Deployment setup changes

**Next Step:** User approval to implement extraction

---

**Document Version:** 1.0
**Created:** 2026-07-11
**Status:** PLANNING PHASE (No Implementation)
**Approval Required:** YES
