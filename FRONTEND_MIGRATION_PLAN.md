# 📋 FRONTEND MIGRATION PLAN
## Moving Next.js Application to `/frontend` Directory

**Status:** PLANNING PHASE (No Files Moved Yet)
**Target:** Move existing Next.js app into `frontend/` while preserving backend readiness
**Date Created:** 2026
**Scope:** Structure reorganization only (No code modifications)

---

## PART 1: ANALYSIS

### Current Project Structure (Root Level)
```
Restaurant-management-master/
├── .next/                              (Build output)
├── .vscode/                            (IDE config)
├── api/                                (API routes - Node/Express backend)
├── app/                                (Next.js App Router)
├── backend/                            (Empty - for future Node backend)
├── components/                         (React components)
├── docs/                               (Empty - for documentation)
├── frontend/                           (Empty - TARGET for Next.js app)
├── hooks/                              (React hooks)
├── lib/                                (Utilities & services)
├── node_modules/                       (Dependencies)
├── prisma/                             (Database schema)
├── public/                             (Static assets)
├── scripts/                            (Empty - for automation scripts)
├── types/                              (TypeScript types)
├── .env                                (Environment variables)
├── .gitignore                          (Git ignore rules)
├── components.json                     (shadcn/ui config)
├── next-env.d.ts                       (Next.js TypeScript definitions)
├── next.config.mjs                     (Next.js configuration)
├── package.json                        (Dependencies & scripts)
├── postcss.config.mjs                  (PostCSS config)
├── tsconfig.json                       (TypeScript config)
└── FIREBASE_*.md                       (Migration blueprints)
```

---

## PART 2: MIGRATION SCOPE

### 2.1 Files/Folders to Move to `/frontend`

#### Core Next.js Application (Move)
- `app/` → `frontend/app/` (Next.js App Router pages)
- `components/` → `frontend/components/` (React components)
- `hooks/` → `frontend/hooks/` (Custom React hooks)
- `lib/` → `frontend/lib/` (Frontend utilities, API client, services)
- `types/` → `frontend/types/` (TypeScript type definitions)
- `public/` → `frontend/public/` (Static assets)
- `.next/` → `frontend/.next/` (Build cache - auto-generated)

#### Configuration Files (Move)
- `next.config.mjs` → `frontend/next.config.mjs`
- `tsconfig.json` → `frontend/tsconfig.json`
- `postcss.config.mjs` → `frontend/postcss.config.mjs`
- `next-env.d.ts` → `frontend/next-env.d.ts`
- `components.json` → `frontend/components.json` (shadcn config)

#### Package Management (Move)
- `package.json` → `frontend/package.json` (Frontend dependencies only)
- `package-lock.json` or `pnpm-lock.yaml` → `frontend/` (if exists)

---

### 2.2 Files/Folders to Remain in Root

#### Backend Related (Stay in Root)
- `api/` - Backend API routes (will eventually move to `/backend`)
- `prisma/` - Database schema (stays during migration, moves later)

#### Project Organization
- `backend/` - Placeholder for future Node backend
- `docs/` - Project documentation (shared)
- `scripts/` - Utility scripts

#### Environment & Config (Stay in Root)
- `.env` - Environment variables (will need duplication/updates)
- `.env.example` - Example config (if created)
- `.gitignore` - Git configuration
- `.git/` - Git history

#### Documentation (Stay in Root)
- `FIREBASE_*.md` - Migration blueprints
- `FRONTEND_MIGRATION_PLAN.md` - This file
- `README.md` - Main project README

#### IDE Config (Stay in Root)
- `.vscode/` - VS Code workspace settings

#### Node Modules (Stay in Root - Initially)
- `node_modules/` - Dependencies (will be duplicated in `frontend/`)

---

### 2.3 Directory Structure After Migration

```
Restaurant-management-master/
├── frontend/                           (Moved Next.js app)
│   ├── app/                           (Next.js App Router)
│   ├── components/                    (React components)
│   ├── hooks/                         (React hooks)
│   ├── lib/                           (Frontend utilities)
│   ├── types/                         (TypeScript types)
│   ├── public/                        (Static assets)
│   ├── .next/                         (Build output)
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── components.json
│   ├── next-env.d.ts
│   ├── package.json
│   └── node_modules/                  (Frontend dependencies)
│
├── backend/                           (Empty - For future Node backend)
│
├── api/                               (Current backend - stays temporarily)
│   ├── middleware/
│   ├── services/
│   └── utils/
│
├── prisma/                            (Database schema - stays temporarily)
│
├── docs/                              (Documentation)
│
├── scripts/                           (Automation scripts)
│
├── .env                               (Root .env - for backend)
│
├── .gitignore
├── .vscode/
├── .git/
└── [Documentation files]
```

---

## PART 3: CONFIGURATION CHANGES REQUIRED

### 3.1 TypeScript Path Configuration

**Current (Root tsconfig.json):**
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

**After Migration (frontend/tsconfig.json):**
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```
✅ **No change needed** - The `@/` alias will still resolve from frontend directory root

---

### 3.2 Next.js Configuration

**Current (Root next.config.mjs):**
```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
export default nextConfig
```

**After Migration (frontend/next.config.mjs):**
```javascript
// Same configuration file, now in frontend/next.config.mjs
// No changes required
```
✅ **No changes needed** - Next.js will find config in frontend directory

---

### 3.3 PostCSS Configuration

**Current (Root postcss.config.mjs):**
```javascript
import tailwindcss from 'tailwindcss'
import postcssNesting from 'tailwindcss/nesting'

export default {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**After Migration (frontend/postcss.config.mjs):**
```javascript
// Same configuration, moved to frontend/postcss.config.mjs
// No changes required
```
✅ **No changes needed** - PostCSS will find config in frontend directory

---

### 3.4 Environment Variables

**Current (.env at root):**
```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
```

**After Migration:**
```
Option A: Keep .env at root + create frontend/.env
Option B: Create frontend/.env.local with frontend-specific variables
```

**Recommended approach:**
- Keep root `.env` for backend/database
- Create `frontend/.env` with:
  ```
  NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
  ```
- Keep `NEXT_PUBLIC_API_BASE_URL` pointing to root `/api` (unchanged)

✅ **.env changes needed** - Separate .env files for frontend/backend

---

### 3.5 Package.json Scripts

**Current (Root package.json):**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  }
}
```

**After Migration (frontend/package.json):**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  }
}
```

**Root package.json (new):**
```json
{
  "scripts": {
    "frontend:dev": "cd frontend && npm run dev",
    "frontend:build": "cd frontend && npm run build",
    "backend:dev": "node api/server.js",
    "dev": "concurrently npm:frontend:dev npm:backend:dev",
    "build": "npm run build -w frontend"
  },
  "workspaces": ["frontend", "backend"]
}
```

✅ **Scripts will change** - Root package.json becomes orchestrator, frontend keeps original scripts

---

### 3.6 Import Paths

**Current Imports in Components:**
```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import type { AuthUser } from '@/types/auth'
```

**After Migration (No Changes Needed):**
```typescript
// Same imports work because:
// 1. @/ alias resolves to frontend/ directory root
// 2. Files are moved together
// 3. Relative imports still work
```

✅ **Imports won't break** - tsconfig alias handles the migration

---

## PART 4: RISK ANALYSIS

### 4.1 Low Risk Items ✅
- Moving directories (Git preserves history)
- Moving config files (No external dependencies)
- Moving static assets (`public/`)
- Moving TypeScript types (Internal only)

### 4.2 Medium Risk Items ⚠️
- **API client imports** - Ensure `/api` references stay absolute
  - Current: `fetch('/api/auth/me')`
  - After: Still `fetch('/api/auth/me')` ✓ (absolute path)
  - Risk: LOW - Absolute paths unchanged

- **Node modules duplication** - Need separate `node_modules` for frontend
  - Current: Single root `node_modules/`
  - After: `frontend/node_modules/`
  - Risk: MEDIUM - Requires separate `npm install` in frontend

- **Build process** - Next.js build paths may need adjustment
  - Risk: MEDIUM - Must verify `.next/` location

### 4.3 High Risk Items 🔴
- **Breaking imports if @/ path not configured correctly**
  - Mitigation: Verify tsconfig.json before migration
  
- **Backend API routes becoming inaccessible**
  - Mitigation: Keep `/api` at root, don't move to `/backend`
  
- **Environment variables not loading**
  - Mitigation: Verify .env duplication before running

- **Git conflicts**
  - Mitigation: Commit all changes before migration

---

## PART 5: DETAILED MIGRATION PROCESS

### 5.1 Pre-Migration Checklist
- [ ] Commit all uncommitted changes to Git
- [ ] Verify all tests pass
- [ ] Create backup branch: `git branch backup-before-migration`
- [ ] Document current .env variables
- [ ] Verify next.config.mjs has no absolute root paths
- [ ] Verify tsconfig.json compilerOptions are portable

### 5.2 Migration Steps

#### Phase 1: Prepare Root Environment
```powershell
# 1. Create root package.json for orchestration (new file)
# 2. Create frontend/.env from root .env
# 3. Verify .gitignore will work with new structure
```

#### Phase 2: Move Frontend Files
```powershell
# 1. Copy app/ → frontend/app/
# 2. Copy components/ → frontend/components/
# 3. Copy hooks/ → frontend/hooks/
# 4. Copy lib/ → frontend/lib/
# 5. Copy types/ → frontend/types/
# 6. Copy public/ → frontend/public/
# 7. Copy *.config.mjs files → frontend/
# 8. Copy tsconfig.json → frontend/
# 9. Copy components.json → frontend/
# 10. Copy next-env.d.ts → frontend/
# 11. Copy package.json → frontend/
```

#### Phase 3: Update Package.json
```powershell
# 1. Create new root package.json with workspaces
# 2. Keep frontend/package.json with original scripts
# 3. Add workspace-aware scripts to root
```

#### Phase 4: Install Dependencies
```powershell
# 1. cd frontend && npm install
# 2. Verify node_modules in frontend/
# 3. Keep root node_modules for now (or remove if using workspaces)
```

#### Phase 5: Verification
```powershell
# 1. npm run frontend:dev (should start on port 3000)
# 2. Verify imports resolve correctly
# 3. Verify @/ alias works
# 4. Verify API calls still reach /api/...
# 5. Build should complete: npm run frontend:build
```

---

## PART 6: IMPACT ANALYSIS

### 6.1 Will Imports Break?
**Answer:** NO ✅

**Why:**
- tsconfig.json moved with its path configuration
- `@/*` alias will resolve from new directory root
- Relative imports unchanged
- API calls use absolute paths `/api/...`

**Verification Command:**
```bash
npm run frontend:build
# No "Cannot find module" errors = Safe
```

---

### 6.2 Will TypeScript Compilation Work?
**Answer:** YES ✅

**Why:**
- tsconfig.json includes pattern preserved
- TypeScript plugin for Next.js moved
- Include/exclude patterns relative to tsconfig location

**Verification:**
```bash
cd frontend && npx tsc --noEmit
# No compilation errors = Safe
```

---

### 6.3 Will npm Scripts Continue Working?
**Answer:** YES, WITH CHANGES ✅

**Current (Root):**
```bash
npm run dev        # Runs: next dev
npm run build      # Runs: next build
npm run start      # Runs: next start
```

**After Migration:**
```bash
# In frontend/:
npm run dev        # Runs: next dev (same)
npm run build      # Runs: next build (same)
npm run start      # Runs: next start (same)

# From root:
npm run frontend:dev   # Runs: cd frontend && npm run dev
npm run build:all      # Runs all builds
```

✅ **Scripts preserved** - Only location changes

---

### 6.4 Will .env Work?
**Answer:** YES, WITH CONFIGURATION ✅

**Current:**
```
.env (root)
├── DATABASE_URL (backend use)
├── DIRECT_URL (backend use)
├── NEXT_PUBLIC_API_BASE_URL (frontend use)
└── Other vars
```

**After Migration:**
```
.env (root)
├── DATABASE_URL
├── DIRECT_URL
└── Other backend vars

frontend/.env
└── NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
```

✅ **Separate .env files recommended**

---

### 6.5 Will Git History Be Preserved?
**Answer:** YES ✅

**Why:**
- Moving files with `git mv` preserves history
- Moving directories preserves commit history
- No data loss

**How to Move with Git:**
```bash
git mv app frontend/app
git mv components frontend/components
git mv hooks frontend/hooks
# etc. - preserves full history for each file
```

---

### 6.6 Will API Routes Still Work?
**Answer:** YES ✅

**Why:**
- API routes remain at `/api/...` (root level)
- Frontend uses absolute paths
- No change to API location

**Example:**
```typescript
// Before migration
fetch('/api/auth/me')  // Works

// After migration (same code in frontend/)
fetch('/api/auth/me')  // Still works
```

---

## PART 7: ROLLBACK PLAN

### 7.1 If Migration Fails

**Option 1: Git Rollback (Safest)**
```bash
# Before migration
git branch backup-before-migration
git checkout main

# If failure
git reset --hard HEAD~1
git checkout main
```

**Option 2: Manual Restore**
```bash
# If git rollback fails, manually move files back
# (using git mv in reverse)
git mv frontend/app app
git mv frontend/components components
# etc.
```

---

### 7.2 Rollback Checklist
- [ ] Test rollback before migration (dry run)
- [ ] Keep backup branch: `git branch backup-before-migration`
- [ ] Document exact git commands used
- [ ] Test `git reset --hard` on a test repo first

---

## PART 8: VERIFICATION STEPS

### 8.1 Post-Migration Verification

**Step 1: Directory Structure**
```bash
# Verify all files in correct locations
ls frontend/app          # Should exist
ls frontend/components   # Should exist
ls frontend/hooks        # Should exist
ls frontend/package.json # Should exist
```

**Step 2: Dependencies**
```bash
cd frontend
npm install
# No errors, correct node_modules created
```

**Step 3: Build Test**
```bash
npm run frontend:build
# Should complete successfully, no errors
```

**Step 4: Dev Server**
```bash
npm run frontend:dev
# Should start on port 3000
# Visit http://localhost:3000
# Should load all pages without errors
```

**Step 5: Import Resolution**
```bash
# Check that imports work
grep -r "from '@/" frontend/components | head -5
# Should show imports like: from '@/lib/utils'
# These should resolve correctly
```

**Step 6: API Connectivity**
```bash
# Test API calls from browser
# Should connect to http://localhost:3000/api/auth/me
# No CORS or path errors
```

---

## PART 9: MIGRATION CHECKLIST

```
═══════════════════════════════════════════════════════════════════

📋 FRONTEND MIGRATION CHECKLIST

═══════════════════════════════════════════════════════════════════

PHASE 1: PRE-MIGRATION PREPARATION
─────────────────────────────────────

[ ] Step 1.1: Commit all changes
    Command: git status (should show "working tree clean")
    
[ ] Step 1.2: Create backup branch
    Command: git branch backup-before-migration

[ ] Step 1.3: Create new root package.json template
    File: package.json (orchestrator version)

[ ] Step 1.4: Verify .env variables
    Check: .env contains DATABASE_URL, DIRECT_URL, etc.

[ ] Step 1.5: Verify tsconfig paths
    Check: paths: { "@/*": ["./*"] }

[ ] Step 1.6: Clean build artifacts (optional)
    Command: rm -r .next/ node_modules/

═══════════════════════════════════════════════════════════════════

PHASE 2: MOVE FILES TO FRONTEND/
─────────────────────────────────

[ ] Step 2.1: Move app/ directory
    Command: git mv app frontend/app

[ ] Step 2.2: Move components/ directory
    Command: git mv components frontend/components

[ ] Step 2.3: Move hooks/ directory
    Command: git mv hooks frontend/hooks

[ ] Step 2.4: Move lib/ directory
    Command: git mv lib frontend/lib

[ ] Step 2.5: Move types/ directory
    Command: git mv types frontend/types

[ ] Step 2.6: Move public/ directory
    Command: git mv public frontend/public

[ ] Step 2.7: Move next.config.mjs
    Command: git mv next.config.mjs frontend/next.config.mjs

[ ] Step 2.8: Move tsconfig.json
    Command: git mv tsconfig.json frontend/tsconfig.json

[ ] Step 2.9: Move postcss.config.mjs
    Command: git mv postcss.config.mjs frontend/postcss.config.mjs

[ ] Step 2.10: Move components.json
    Command: git mv components.json frontend/components.json

[ ] Step 2.11: Move next-env.d.ts
    Command: git mv next-env.d.ts frontend/next-env.d.ts

[ ] Step 2.12: Move package.json
    Command: git mv package.json frontend/package.json

═══════════════════════════════════════════════════════════════════

PHASE 3: CREATE NEW ROOT FILES
──────────────────────────────

[ ] Step 3.1: Create new root package.json (orchestrator)
    File: package.json (workspace version)

[ ] Step 3.2: Create frontend/.env from root .env
    File: frontend/.env (with NEXT_PUBLIC_API_BASE_URL)

[ ] Step 3.3: Update root .gitignore (if needed)
    Check: Paths still correct after move

[ ] Step 3.4: Verify .git structure
    Command: git status (should show moved files)

═══════════════════════════════════════════════════════════════════

PHASE 4: INSTALL DEPENDENCIES
──────────────────────────────

[ ] Step 4.1: Install frontend dependencies
    Command: cd frontend && npm install

[ ] Step 4.2: Verify frontend/node_modules created
    Check: ls frontend/node_modules (should exist)

[ ] Step 4.3: Verify packages installed correctly
    Command: cd frontend && npm list (no errors)

═══════════════════════════════════════════════════════════════════

PHASE 5: VERIFICATION & TESTING
────────────────────────────────

[ ] Step 5.1: Verify directory structure
    Command: ls -la frontend/ (should show app, components, etc.)

[ ] Step 5.2: Verify TypeScript compilation
    Command: cd frontend && npx tsc --noEmit (no errors)

[ ] Step 5.3: Start development server
    Command: cd frontend && npm run dev
    Check: Server starts on port 3000 without errors

[ ] Step 5.4: Test imports in browser
    Visit: http://localhost:3000
    Check: All pages load, no console errors

[ ] Step 5.5: Test API connectivity
    Check: Network tab shows /api/auth/me succeeding

[ ] Step 5.6: Build frontend for production
    Command: cd frontend && npm run build
    Check: Build completes successfully

[ ] Step 5.7: Verify no broken imports
    Command: cd frontend && npm run build 2>&1 | grep -i "error"
    Check: No "Cannot find module" errors

[ ] Step 5.8: Test root orchestrator scripts (if added)
    Command: npm run frontend:dev
    Check: Frontend starts correctly

═══════════════════════════════════════════════════════════════════

PHASE 6: COMMIT & CLEANUP
──────────────────────────

[ ] Step 6.1: Verify all changes with git status
    Command: git status (should show all files moved)

[ ] Step 6.2: Commit migration
    Command: git commit -m "refactor: move Next.js app to frontend/"

[ ] Step 6.3: Verify commit history preserved
    Command: git log --follow frontend/app/layout.tsx
    Check: Should show full history from app/layout.tsx

[ ] Step 6.4: Push changes
    Command: git push origin main

═══════════════════════════════════════════════════════════════════

PHASE 7: POST-MIGRATION VERIFICATION
─────────────────────────────────────

[ ] Step 7.1: Fresh clone test (optional but recommended)
    Command: git clone <repo> test-clone
    Command: cd test-clone/frontend && npm install && npm run dev
    Check: All works without issues

[ ] Step 7.2: Verify backend API routes still work
    Check: /api/auth/me, /api/dashboard/*, etc. respond

[ ] Step 7.3: Verify .env loading
    Check: Environment variables in app (browser console)

[ ] Step 7.4: Run any existing tests
    Command: cd frontend && npm test (if tests exist)

═══════════════════════════════════════════════════════════════════

✅ MIGRATION COMPLETE

═══════════════════════════════════════════════════════════════════
```

---

## PART 10: SUMMARY

| Aspect | Current | After Migration | Risk | Action |
|--------|---------|-----------------|------|--------|
| **App location** | Root | `/frontend/` | Low | Move with `git mv` |
| **Components** | Root | `/frontend/` | Low | Move with `git mv` |
| **Imports** | `@/lib/...` | `@/lib/...` | Low | Preserved by tsconfig |
| **API paths** | `/api/...` | `/api/...` | Low | Unchanged (absolute) |
| **package.json** | Root | `/frontend/` | Medium | Move + create orchestrator |
| **node_modules** | Root | `/frontend/` | Medium | Separate install needed |
| **Git history** | Preserved | Preserved | Low | Use `git mv` |
| **.env** | Root | Root + Frontend | Low | Duplicate variables |
| **Build** | Works | Works | Low | Same config |
| **Dev server** | Works | Works | Low | Same scripts |

---

## PART 11: FINAL NOTES

- ✅ **No code modifications** required
- ✅ **No package installations** yet (manual migration only)
- ✅ **Git history preserved** if using `git mv`
- ✅ **Imports won't break** (tsconfig paths preserved)
- ✅ **Rollback possible** if needed (via git reset)

---

**Status:** Plan ready for approval.
**Next Step:** Await approval before executing migration.

