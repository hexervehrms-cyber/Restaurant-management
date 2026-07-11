# 📋 FRONTEND EXTRACTION PLAN
## Separating Next.js Frontend from Backend Dependencies

**Status:** PLANNING PHASE (No code modifications yet)
**Goal:** Transform frontend/ into a pure UI-only Next.js application
**Strategy:** Remove backend dependencies while preserving all UI/UX

---

## PART 1: BACKEND DEPENDENCIES AUDIT

### 1.1 API Route Files (25 route handlers)

All files in `frontend/app/api/` are backend dependencies:

#### Authentication & User
| File | Backend Dependencies | Prevents Build | Action |
|------|---------------------|-----------------|--------|
| `app/api/auth/me/route.ts` | `@/api/middleware/auth`, `@/api/services/auth.service` | ✅ YES | **Remove** |

#### Dashboard
| File | Backend Dependencies | Prevents Build | Action |
|------|---------------------|-----------------|--------|
| `app/api/dashboard/summary/route.ts` | Prisma, `@/api/services/dashboard.service` | ✅ YES | **Remove** |
| `app/api/dashboard/revenue-chart/route.ts` | Prisma, `@/api/services/dashboard.service` | ✅ YES | **Remove** |
| `app/api/dashboard/sidebar-counts/route.ts` | Prisma, `@/api/services/dashboard.service` | ✅ YES | **Remove** |

#### Orders
| File | Backend Dependencies | Prevents Build | Action |
|------|---------------------|-----------------|--------|
| `app/api/orders/route.ts` | Prisma, `@/api/services/pos.orders.service` | ✅ YES | **Remove** |
| `app/api/orders/live/route.ts` | Prisma, `@/api/services/orders.service` | ✅ YES | **Remove** |
| `app/api/orders/[id]/send-to-kitchen/route.ts` | Prisma, `@/api/middleware/auth` | ✅ YES | **Remove** |

#### Menu
| File | Backend Dependencies | Prevents Build | Action |
|------|---------------------|-----------------|--------|
| `app/api/menu/items/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/pos/menu/route.ts` | Prisma, `@/api/middleware/auth`, `@/api/middleware/tenant` | ✅ YES | **Remove** |

#### POS
| File | Backend Dependencies | Prevents Build | Action |
|------|---------------------|-----------------|--------|
| `app/api/pos/tables/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/pos/customers/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/pos/customers/search/route.ts` | Prisma, `@/api/middleware/auth` | ✅ YES | **Remove** |

#### Other Modules
| File | Backend Dependencies | Prevents Build | Action |
|------|---------------------|-----------------|--------|
| `app/api/tables/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/reservations/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/crm/customers/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/billing/invoices/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/bills/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/payments/route.ts` | Prisma, Razorpay | ✅ YES | **Remove** |
| `app/api/payments/razorpay/verify/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/payments/razorpay/create-order/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/payments/razorpay/webhook/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/inventory/items/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/notifications/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/restaurants/current-status/route.ts` | Prisma | ✅ YES | **Remove** |
| `app/api/staff/route.ts` | Prisma | ✅ YES | **Remove** |

**Summary:** 25 API route handlers - **All depend on Prisma database client**

---

### 1.2 Backend Service Files (8 files in `frontend/api/`)

Located in: `frontend/api/services/`, `frontend/api/middleware/`, `frontend/api/utils/`

#### Services
| File | Purpose | Dependencies | Prevents Build | Action |
|------|---------|--------------|-----------------|--------|
| `api/services/auth.service.ts` | User authentication via Prisma | Prisma | ✅ YES | **Remove** |
| `api/services/dashboard.service.ts` | Dashboard metrics via Prisma | Prisma, date-fns | ✅ YES | **Remove** |
| `api/services/orders.service.ts` | Order queries via Prisma | Prisma | ✅ YES | **Remove** |
| `api/services/pos.orders.service.ts` | POS order creation via Prisma | Prisma | ✅ YES | **Remove** |
| `api/services/tables.service.ts` | Table management via Prisma | Prisma | ✅ YES | **Remove** |

#### Middleware
| File | Purpose | Dependencies | Prevents Build | Action |
|------|---------|--------------|-----------------|--------|
| `api/middleware/auth.ts` | Authentication context | Mock data only | ❌ NO | **Remove** |
| `api/middleware/tenant.ts` | Tenant context extraction | No Prisma | ❌ NO | **Remove** |

#### Utilities
| File | Purpose | Dependencies | Prevents Build | Action |
|------|---------|--------------|-----------------|--------|
| `api/utils/responses.ts` | Response formatting | None (utility) | ❌ NO | **Remove** |
| `api/utils/errors.ts` | Error classes | None (utility) | ❌ NO | **Remove** |

**Summary:** 8 backend files + 25 route handlers = **33 total backend dependencies**

---

### 1.3 Prisma Dependencies

#### Database Schema
| File | Impact | Action |
|------|--------|--------|
| `frontend/prisma/schema.prisma` | Defines PostgreSQL schema | **Remove** |
| `frontend/prisma/migrations/` | Migration history | **Remove** |

#### Generated Prisma Client
| File | Impact | Prevents Build | Action |
|------|--------|-----------------|--------|
| `frontend/node_modules/@prisma/client/` | Prisma runtime | ✅ YES | **Remove via npm prune** |

**Error:** "Error: @prisma/client did not initialize yet"
- Cause: Prisma tries to generate client from schema.prisma on build
- Solution: Remove schema, let npm prune remove unused package

---

### 1.4 Hook Dependencies on Backend APIs

#### Hooks using `@/lib/api/` (8 hooks affected)

| Hook | API Used | Prevents Frontend | Action |
|------|----------|-------------------|--------|
| `useAuth()` | `@/lib/api/auth` | ❌ NO (optional) | **Replace with mock** |
| `useDashboardSummary()` | `@/lib/api/dashboard` | ❌ NO (optional) | **Replace with mock** |
| `useRevenueChart()` | `@/lib/api/dashboard` | ❌ NO (optional) | **Replace with mock** |
| `useSidebarCounts()` | `@/lib/api/dashboard` | ❌ NO (optional) | **Replace with mock** |
| `useLiveOrders()` | `@/lib/api/orders` | ❌ NO (optional) | **Replace with mock** |
| `useTables()` | `@/lib/api/orders` | ❌ NO (optional) | **Replace with mock** |
| `useRestaurantStatus()` | `@/lib/api/dashboard` | ❌ NO (optional) | **Replace with mock** |
| `useNotifications()` | `@/lib/api/dashboard` | ❌ NO (optional) | **Replace with mock** |

**Key Finding:** These hooks call fetch() - they work client-side but need data sources
- Currently call `/api/...` endpoints
- Endpoints don't exist after API routes removed
- Solutions: Mock data OR proxy to root-level API

---

### 1.5 Environment Dependencies

#### `.env` Database Configuration
```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

**Impact:** 
- Prisma reads these on build
- Required for Prisma client generation
- No longer needed after Prisma removal

**Action:** **Keep .env but make it optional**

---

### 1.6 Configuration Dependencies

#### `frontend/prisma/` Directory
- Contains schema.prisma
- Prisma generates client on build via tsconfig
- **Action:** **Remove prisma/ directory**

#### `frontend/.env`
- Used by Prisma during build
- **Action:** **Keep but it becomes optional**

#### `next.config.mjs`
- No backend-specific configuration
- **Action:** **Keep unchanged**

#### `tsconfig.json`
- No backend-specific configuration
- **Action:** **Keep unchanged**

#### `package.json`
- Contains @prisma/client dependency
- **Action:** **Keep - npm will handle via prune**

---

## PART 2: EXTRACTION STRATEGY

### 2.1 What Gets Removed

#### Complete Removal (Folders)
```
frontend/app/api/                    ← 25 route handlers
frontend/api/                        ← 8 backend service files
frontend/prisma/                     ← Database schema
```

#### Partial Removal (Dependencies)
```
frontend/package.json
  - Remove: @prisma/client
  - Keep: All React/Next.js packages
```

#### Cleanup
```
frontend/.env                        ← Can be deleted (no longer needed)
frontend/node_modules/@prisma/       ← Will be removed by npm prune
```

---

### 2.2 What Gets Preserved

#### Frontend Code (Untouched)
```
✅ frontend/app/(dashboard)/          ← All page components
✅ frontend/app/layout.tsx            ← Root layout
✅ frontend/components/               ← All UI components
✅ frontend/hooks/                    ← All React hooks (refactored)
✅ frontend/lib/                      ← Utilities & services
✅ frontend/types/                    ← TypeScript types
✅ frontend/public/                   ← Static assets
```

#### Configuration Files (Unchanged)
```
✅ frontend/next.config.mjs           ← No changes needed
✅ frontend/tsconfig.json             ← No changes needed
✅ frontend/postcss.config.mjs        ← No changes needed
✅ frontend/components.json           ← No changes needed
✅ frontend/next-env.d.ts             ← No changes needed
```

---

### 2.3 Hook Refactoring Strategy

**Issue:** 8 hooks currently call API endpoints that will be removed

**Options:**

#### Option A: Replace with Mock Data ✅ Recommended
```typescript
// Current:
const { data, loading } = useDashboardSummary(branchId)

// After refactoring:
const { data, loading } = useDashboardSummary(branchId)
// Returns mock data instead of API call
```

**Advantages:**
- Frontend builds and runs
- UI displays with placeholder data
- Easy to connect to Firebase later
- No API dependency

**Implementation:**
1. Create `frontend/lib/api/mock/` directory
2. Create mock data generators for each hook
3. Update hooks to use mock data
4. No code logic changes, only data source

#### Option B: Keep API References (Deferred)
```typescript
// Keep calling /api/* endpoints
// These will be implemented in Firebase later
// For now, they fail gracefully
```

**Disadvantages:**
- Frontend won't work without backend
- Complicates testing & development
- Delays verification

---

## PART 3: EXTRACTION STEPS

### Step 1: Identify What to Delete
```
❌ frontend/app/api/                 (25 route handlers)
❌ frontend/api/                     (8 backend files)
❌ frontend/prisma/                  (Database schema)
❌ @prisma/client from package.json
```

### Step 2: Update package.json
```json
// Remove:
"@prisma/client": "^5.8.0"

// Keep:
All React, Next.js, UI packages
```

### Step 3: Create Mock Data System
```
frontend/lib/api/mock/
├── dashboardMocks.ts
├── ordersMocks.ts
├── customersMocks.ts
├── menuMocks.ts
└── index.ts
```

### Step 4: Refactor Hooks
```typescript
// Update 8 hooks to use mock data instead of API calls
// Keep same interface/return type
// Only change data source
```

### Step 5: Clean Dependencies
```bash
npm install --save-dev
npm prune --production  # Remove dev dependencies
npm install            # Fresh install without Prisma
```

### Step 6: Verify Build
```bash
npm run build           # Should complete without errors
npm run dev             # Should start server
```

### Step 7: Verify UI
```
✓ All pages load
✓ No console errors
✓ No missing imports
✓ Styling intact
✓ Routing works
✓ Components render
```

---

## PART 4: BUILD VERIFICATION CHECKLIST

After extraction, verify:

### Build Completeness
- [ ] `npm run build` completes without errors
- [ ] No "Cannot find module" errors
- [ ] No "@prisma/client" errors
- [ ] No missing import errors
- [ ] No TypeScript compilation errors

### Development Server
- [ ] `npm run dev` starts on port 3000
- [ ] Pages load without 500 errors
- [ ] No console errors
- [ ] No server-side exceptions

### UI Functionality
- [ ] All dashboard pages load
- [ ] All sidebar navigation works
- [ ] POS Terminal page loads
- [ ] Menu Management page loads
- [ ] Orders page loads
- [ ] Styling looks correct
- [ ] Responsive design works

### Data Verification
- [ ] useDashboardSummary returns mock data
- [ ] useMenuItems returns mock data
- [ ] useTables returns mock data
- [ ] useOrders returns mock data
- [ ] useLiveOrders returns mock data
- [ ] All other hooks return data

---

## PART 5: IMPLEMENTATION PHASES

### Phase 1: Remove Backend Routes
**Time: 5 minutes**
1. Delete `frontend/app/api/` directory
2. Verify no build errors
3. Note: This will break API calls

### Phase 2: Remove Backend Services
**Time: 5 minutes**
1. Delete `frontend/api/` directory
2. Delete `frontend/prisma/` directory
3. Verify npm can install without Prisma

### Phase 3: Create Mock Data
**Time: 30 minutes**
1. Create `frontend/lib/api/mock/` directory
2. Generate mock data for each feature
3. Keep mock data realistic

### Phase 4: Refactor Hooks
**Time: 30 minutes**
1. Update 8 hooks to use mock data
2. Preserve hook signatures
3. Keep all error handling

### Phase 5: Clean Dependencies
**Time: 10 minutes**
1. Remove @prisma/client from package.json
2. Run `npm install`
3. Run `npm prune`

### Phase 6: Verify
**Time: 15 minutes**
1. Build: `npm run build`
2. Dev: `npm run dev`
3. Test all pages load

**Total Time: ~90 minutes**

---

## PART 6: ROLLBACK PLAN

If extraction fails:

```bash
# Restore from git
git checkout frontend/

# Or restore from backup folder
cp -r frontend-backup/* frontend/
```

---

## PART 7: POST-EXTRACTION NEXT STEPS

After successful extraction:

1. **Frontend is now pure UI-only** ✅
2. **Root `/api` still available for development** ✅
3. **Can proceed with Firebase implementation** ✅
4. **Each feature migrates independently** ✅

---

## Summary Table

| Item | Current | After Extraction | Impact |
|------|---------|------------------|--------|
| API routes | 25 files | Removed | Build succeeds |
| Backend services | 8 files | Removed | No DB calls |
| Prisma | Required | Optional | No build errors |
| Hooks (8) | API calls | Mock data | UI displays data |
| UI Components | Working | Working | No changes |
| Styling | Working | Working | No changes |
| Pages | Working | Working | No changes |
| TypeScript | Working | Working | No changes |
| Build time | Slow | Fast | ~2x faster |

---

## Status

🟡 **PLANNING PHASE**

**Awaiting:** Approval to proceed with extraction

**Next:** Execute extraction steps one by one

