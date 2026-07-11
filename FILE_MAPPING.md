# 📁 DETAILED FILE MAPPING
## Exact Files Moving from Monolithic to Backend + Frontend

---

## PART 1: BACKEND FILES (Move to restaurant-backend/src/)

### Services (5 files)
```
Current Location              →  Backend Location
─────────────────────────────────────────────────────
api/services/auth.service.ts         → src/api/services/auth.service.ts
api/services/dashboard.service.ts    → src/api/services/dashboard.service.ts
api/services/orders.service.ts       → src/api/services/orders.service.ts
api/services/pos.orders.service.ts   → src/api/services/pos.orders.service.ts
api/services/tables.service.ts       → src/api/services/tables.service.ts
```

**Usage in Backend:** Called by route handlers

### Middleware (2 files)
```
api/middleware/auth.ts              → src/api/middleware/auth.ts
api/middleware/tenant.ts            → src/api/middleware/tenant.ts
```

**Usage in Backend:** Applied to route handlers for auth/tenant validation

### Utilities (2 files)
```
api/utils/responses.ts              → src/api/utils/responses.ts
api/utils/errors.ts                 → src/api/utils/errors.ts
```

**Usage in Backend:** Used by all route handlers for consistent responses

### API Routes (25 files - Converted from Next.js to Express)

#### Authentication (1 file)
```
app/api/auth/me/route.ts            → src/routes/auth.ts (GET /api/auth/me)
```

#### Dashboard (3 files)
```
app/api/dashboard/summary/route.ts   → src/routes/dashboard.ts (GET /api/dashboard/summary)
app/api/dashboard/revenue-chart/route.ts → src/routes/dashboard.ts (GET /api/dashboard/revenue-chart)
app/api/dashboard/sidebar-counts/route.ts → src/routes/dashboard.ts (GET /api/dashboard/sidebar-counts)
```

#### Orders (3 files)
```
app/api/orders/route.ts              → src/routes/orders.ts (GET/POST /api/orders)
app/api/orders/live/route.ts         → src/routes/orders.ts (GET /api/orders/live)
app/api/orders/[id]/send-to-kitchen/route.ts → src/routes/orders.ts (POST /api/orders/:id/send-to-kitchen)
```

#### Menu (2 files)
```
app/api/menu/items/route.ts          → src/routes/menu.ts (GET/POST /api/menu/items)
app/api/pos/menu/route.ts            → src/routes/menu.ts (GET /api/pos/menu)
```

#### POS (3 files)
```
app/api/pos/tables/route.ts          → src/routes/pos.ts (GET/POST /api/pos/tables)
app/api/pos/customers/route.ts       → src/routes/pos.ts (GET/POST /api/pos/customers)
app/api/pos/customers/search/route.ts → src/routes/pos.ts (GET /api/pos/customers/search)
```

#### Tables (1 file)
```
app/api/tables/route.ts              → src/routes/tables.ts (GET/POST /api/tables)
```

#### Reservations (1 file)
```
app/api/reservations/route.ts        → src/routes/reservations.ts (GET/POST /api/reservations)
```

#### CRM (1 file)
```
app/api/crm/customers/route.ts       → src/routes/crm.ts (GET/POST /api/crm/customers)
```

#### Billing (2 files)
```
app/api/billing/invoices/route.ts    → src/routes/billing.ts (GET /api/billing/invoices)
app/api/bills/route.ts               → src/routes/billing.ts (GET/POST /api/bills)
```

#### Payments (4 files)
```
app/api/payments/route.ts            → src/routes/payments.ts (GET/POST /api/payments)
app/api/payments/razorpay/verify/route.ts → src/routes/payments.ts (POST /api/payments/razorpay/verify)
app/api/payments/razorpay/create-order/route.ts → src/routes/payments.ts (POST /api/payments/razorpay/create-order)
app/api/payments/razorpay/webhook/route.ts → src/routes/payments.ts (POST /api/payments/razorpay/webhook)
```

#### Inventory (1 file)
```
app/api/inventory/items/route.ts     → src/routes/inventory.ts (GET/POST /api/inventory/items)
```

#### Notifications (1 file)
```
app/api/notifications/route.ts       → src/routes/notifications.ts (GET /api/notifications)
```

#### Restaurant Status (1 file)
```
app/api/restaurants/current-status/route.ts → src/routes/restaurants.ts (GET /api/restaurants/current-status)
```

#### Staff (1 file)
```
app/api/staff/route.ts               → src/routes/staff.ts (GET/POST /api/staff)
```

### Database (3 items)
```
prisma/schema.prisma                 → backend/prisma/schema.prisma
prisma/migrations/                   → backend/prisma/migrations/ (entire directory)
prisma/seed.ts                       → backend/prisma/seed.ts
```

### Types (5 files - Copied to Backend)
```
types/api.ts                         → backend/src/types/api.ts
types/auth.ts                        → backend/src/types/auth.ts
types/dashboard.ts                   → backend/src/types/dashboard.ts
types/notifications.ts               → backend/src/types/notifications.ts
types/orders.ts                      → backend/src/types/orders.ts
```

### Backend Configuration Files (Created)
```
backend/src/index.ts                 (NEW - Express/Hono server entry)
backend/package.json                 (NEW - Backend dependencies)
backend/tsconfig.json                (NEW - Backend TypeScript config)
backend/.env                         (NEW - Database URL + secrets)
backend/.env.example                 (NEW - Example environment)
backend/.gitignore                   (NEW - Backend ignore rules)
backend/README.md                    (NEW - Backend documentation)
```

---

## PART 2: FRONTEND FILES (Stay in restaurant-frontend/)

### Pages (Unchanged)
```
✅ app/(dashboard)/
   ├── analytics/page.tsx
   ├── billing/page.tsx
   ├── crm/page.tsx
   ├── inventory/page.tsx
   ├── kitchen/page.tsx
   ├── layout.tsx
   ├── menu/page.tsx
   ├── orders/page.tsx
   ├── page.tsx (dashboard home)
   ├── pos/page.tsx
   ├── reservations/page.tsx
   ├── settings/page.tsx
   ├── staff/page.tsx
   └── tables/page.tsx

✅ app/globals.css
✅ app/layout.tsx
```

### Components (Unchanged)
```
✅ components/
   ├── analytics/
   ├── billing/
   ├── crm/
   ├── dashboard/
   ├── inventory/
   ├── kitchen/
   ├── layout/
   ├── menu/
   ├── orders/
   ├── pos/
   ├── reservations/
   ├── settings/
   ├── staff/
   ├── tables/
   └── ui/
```

### Hooks (Modified - API calls updated)
```
🔄 hooks/useAuth.ts                  (Update API calls)
🔄 hooks/useAuthContext.ts           (Update API calls)
🔄 hooks/useBillingInvoices.ts       (Update API calls)
🔄 hooks/useCRMCustomers.ts          (Update API calls)
🔄 hooks/useDashboardSummary.ts      (Update API calls)
🔄 hooks/useInventoryItems.ts        (Update API calls)
🔄 hooks/useLiveOrders.ts            (Update API calls)
🔄 hooks/useMenuItems.ts             (Update API calls)
🔄 hooks/useNotifications.ts         (Update API calls)
🔄 hooks/usePOS.ts                   (Update API calls)
🔄 hooks/useRazorpay.ts              (Update API calls)
🔄 hooks/useReservations.ts          (Update API calls)
🔄 hooks/useRestaurantStatus.ts      (Update API calls)
🔄 hooks/useRevenueChart.ts          (Update API calls)
🔄 hooks/useSidebarCounts.ts         (Update API calls)
🔄 hooks/useStaff.ts                 (Update API calls)
🔄 hooks/useTables.ts                (Update API calls)
✅ hooks/use-mobile.ts               (No changes - no API calls)
```

### Library Files

#### API Client (Modified)
```
🔄 lib/api/client.ts                 (Change API_BASE URL)
✅ lib/api/auth.ts                   (No changes - same functions)
✅ lib/api/dashboard.ts              (No changes - same functions)
✅ lib/api/orders.ts                 (No changes - same functions)
```

#### Other Libraries (Unchanged)
```
✅ lib/utils.ts                      (UI utilities)
✅ lib/store.ts                      (Zustand state)
✅ lib/razorpay.ts                   (Razorpay integration)
✅ lib/mock-data.ts                  (Optional mock data)
```

### Types (Unchanged - Kept in Frontend, Copied to Backend)
```
✅ types/api.ts
✅ types/auth.ts
✅ types/dashboard.ts
✅ types/notifications.ts
✅ types/orders.ts
```

### Public Assets (Unchanged)
```
✅ public/apple-icon.png
✅ public/icon-dark-32x32.png
✅ public/icon-light-32x32.png
✅ public/icon.svg
✅ public/placeholder-logo.png
✅ public/placeholder-logo.svg
✅ public/placeholder-user.jpg
✅ public/placeholder.jpg
✅ public/placeholder.svg
```

### Frontend Configuration (Unchanged or Minor Update)
```
✅ next.config.mjs                   (No changes)
✅ tsconfig.json                     (No changes)
✅ postcss.config.mjs                (No changes)
✅ components.json                   (No changes - shadcn config)
✅ next-env.d.ts                     (No changes)
🔄 package.json                      (Remove @prisma/client)
🔄 .env.local                        (NEW - Add NEXT_PUBLIC_API_URL)
✅ .gitignore                        (No changes)
```

---

## PART 3: FILES TO REMOVE FROM FRONTEND

### Backend Directories
```
❌ api/                              (Move to backend)
   ├── middleware/
   ├── services/
   └── utils/

❌ app/api/                          (Move to backend, convert routes)
   ├── auth/
   ├── billing/
   ├── bills/
   ├── crm/
   ├── dashboard/
   ├── inventory/
   ├── menu/
   ├── notifications/
   ├── orders/
   ├── payments/
   ├── pos/
   ├── restaurants/
   ├── reservations/
   ├── staff/
   └── tables/

❌ prisma/                           (Copy to backend)
   ├── migrations/
   ├── schema.prisma
   └── seed.ts
```

### Dependencies to Remove
```
❌ @prisma/client from package.json
```

### Root-Level Only (Not in Frontend Copy)
These stay in monorepo root or move to backend only:
```
❌ api/ directory                    (Backend only now)
❌ prisma/ directory                 (Backend only now)
```

---

## PART 4: SHARED/DUPLICATED FILES

### Types (Duplicated in Both)
```
types/api.ts
├── Frontend: types/api.ts
└── Backend: src/types/api.ts

types/auth.ts
├── Frontend: types/auth.ts
└── Backend: src/types/auth.ts

types/dashboard.ts
├── Frontend: types/dashboard.ts
└── Backend: src/types/dashboard.ts

types/notifications.ts
├── Frontend: types/notifications.ts
└── Backend: src/types/notifications.ts

types/orders.ts
├── Frontend: types/orders.ts
└── Backend: src/types/orders.ts
```

**Future Option:** Move to shared `packages/types/` in monorepo

---

## PART 5: NEW FILES TO CREATE

### Backend Structure
```
restaurant-backend/
├── src/
│   ├── api/                    (copied from root api/)
│   ├── routes/                 (converted from app/api/)
│   ├── types/                  (copied from types/)
│   └── index.ts               (NEW - Express/Hono server)
├── prisma/                    (copied from root prisma/)
├── package.json               (NEW - backend deps)
├── tsconfig.json              (NEW - backend config)
├── .env                       (NEW - backend secrets)
├── .env.example               (NEW - example config)
├── .gitignore                 (NEW - backend ignore)
└── README.md                  (NEW - backend docs)
```

### Frontend Structure
```
restaurant-frontend/
├── .env.local                 (NEW - NEXT_PUBLIC_API_URL)
├── package.json               (MODIFIED - remove @prisma/client)
└── [everything else unchanged]
```

---

## PART 6: DEPENDENCY BREAKDOWN

### Frontend Dependencies (Kept)
```json
{
  "next": "^16.2.6",
  "react": "^19",
  "react-dom": "^19",
  "@base-ui/react": "^1.5.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "^1.1.1",
  "date-fns": "^3.0.0",
  "framer-motion": "^12.40.0",
  "lucide-react": "^1.16.0",
  "recharts": "3.8.0",
  "shadcn": "^4.8.0",
  "tailwind-merge": "^3.3.1",
  "tw-animate-css": "^1.4.0",
  "zustand": "^5.0.14",
  "@tailwindcss/postcss": "^4.2.0",
  "@types/node": "^24",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "postcss": "^8.5",
  "tailwindcss": "^4.2.0",
  "typescript": "5.7.3",
  "@vercel/analytics": "1.6.1"
}
```

### Removed from Frontend
```json
{
  "@prisma/client": "^5.8.0"  ❌ REMOVE
}
```

### Backend Dependencies (New)
```json
{
  "express": "^4.18.2",
  "@prisma/client": "^5.8.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "typescript": "^5.0.0",
  "tsx": "^4.0.0",
  "@types/express": "^4.17.21",
  "@types/node": "^20.0.0"
}
```

---

## PART 7: MIGRATION CHECKLIST

### Backend Creation
- [ ] Create `restaurant-backend/` directory
- [ ] Copy `api/` → `backend/src/api/`
- [ ] Copy `prisma/` → `backend/prisma/`
- [ ] Copy `types/` → `backend/src/types/`
- [ ] Create `backend/src/routes/` (convert from app/api)
- [ ] Create `backend/src/index.ts` (Express/Hono server)
- [ ] Create `backend/package.json`
- [ ] Create `backend/tsconfig.json`
- [ ] Create `backend/.env`

### Frontend Update
- [ ] Remove `api/` directory
- [ ] Remove `app/api/` directory
- [ ] Keep `types/` (or sync with backend)
- [ ] Update `lib/api/client.ts` (API_BASE)
- [ ] Remove `@prisma/client` from package.json
- [ ] Verify all hooks still import from `@/lib/api`
- [ ] Create `frontend/.env.local`

### Verification
- [ ] Backend builds without errors
- [ ] Frontend builds without "@prisma/client" errors
- [ ] All routes respond correctly
- [ ] All hooks receive data
- [ ] End-to-end functionality verified

---

## PART 8: FILE COUNT SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| Backend Services | 5 | Move |
| Backend Middleware | 2 | Move |
| Backend Utilities | 2 | Move |
| API Routes | 25 | Move & Convert |
| Database Files | 3 | Copy |
| Type Definitions | 5 | Copy |
| Frontend Pages | 13 | Keep |
| Frontend Components | 50+ | Keep |
| Frontend Hooks | 18 | Update API Calls |
| Config Files | 10 | Keep/Update |
| **TOTAL MOVE TO BACKEND** | 37 | Move |
| **TOTAL UPDATE/MODIFY** | 18 | Update |
| **TOTAL KEEP UNCHANGED** | 100+ | Keep |

---

## PART 9: QUICK REFERENCE

### To Backend (37 files)
```
api/middleware/ (2)
api/services/ (5)
api/utils/ (2)
app/api/ (25) ← Converted
prisma/ (3)
```

### Copy to Both (5 files)
```
types/api.ts
types/auth.ts
types/dashboard.ts
types/notifications.ts
types/orders.ts
```

### Keep in Frontend (100+)
```
app/(dashboard)/ → All pages
components/ → All components
hooks/ → All hooks
lib/api/ → API client (update base URL)
lib/ → Other utilities
types/ → Type definitions
public/ → Assets
config files
```

### Remove from Frontend
```
api/ → Move to backend
app/api/ → Move to backend
prisma/ → Copy to backend
@prisma/client → Dependency removed
```

---

**Version:** 1.0  
**Created:** 2026-07-11  
**Purpose:** File-by-file extraction mapping  
**Status:** Awaiting Approval
