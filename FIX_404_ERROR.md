# Fix 404 Error on Dashboard Status Endpoint

## Error Summary

```
Error loading dashboard
API request failed: Not Found (HTTP 404)
Stack: useRestaurantStatus.ts → getOperationalStatus()
```

## Root Cause Analysis

The error indicates that the frontend is trying to call `/api/dashboard/status` but receiving an HTTP 404 response.

**Status**: The route file EXISTS at `app/api/dashboard/status/route.ts` ✓

## Most Likely Cause

**The Next.js dev server needs to be restarted after the route file was created/modified.**

Next.js caches API routes at startup. When you add a new route file, the dev server must restart to detect it.

## Solution Steps

### Step 1: Stop the Dev Server
In your terminal:
```bash
# Press Ctrl+C to stop the current dev server
```

### Step 2: Clear Next.js Cache
```bash
rm -r .next
```

Or on Windows PowerShell:
```powershell
Remove-Item -Recurse -Force .next
```

### Step 3: Restart the Dev Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Step 4: Verify the Route
Open browser DevTools Network tab and check that:
- Request to `/api/dashboard/status?branchId=...&restaurantId=...` returns **200 OK**
- Response has structure: `{ success: true, data: {...} }`

### Step 5: Hard Refresh Dashboard
```
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)
```

## Alternative: Manual Verification

If the route still returns 404 after restart, run this diagnostic:

### Check 1: Route File Exists
```bash
ls -la app/api/dashboard/status/route.ts
```

Expected: File exists and was recently modified

### Check 2: Syntax Check
```bash
npm run build
```

Look for compilation errors related to `app/api/dashboard/status/route.ts`

### Check 3: Check Imports
Verify all imports in the route are resolvable:
- `@/api/middleware/auth` → `api/middleware/auth.ts` ✓
- `@/api/middleware/tenant` → `api/middleware/tenant.ts` ✓
- `@/api/utils/responses` → `api/utils/responses.ts` ✓
- `@/api/utils/errors` → `api/utils/errors.ts` ✓
- `@/api/services/dashboard-status.service` → `api/services/dashboard-status.service.ts` ✓

All imports are correct.

### Check 3: Route Export
The route file MUST export `GET` and/or `PATCH`:
```typescript
export async function GET(request: NextRequest) { ... }
export async function PATCH(request: NextRequest) { ... }
```

✓ Both are present in `app/api/dashboard/status/route.ts`

## Technical Details

### How Next.js App Router Works

File structure:
```
app/
  api/
    dashboard/
      status/
        route.ts  ← Handles GET/PATCH /api/dashboard/status
```

When Next.js starts, it:
1. Scans `app/api/` directory recursively
2. Finds all `route.ts` files
3. Creates HTTP handlers based on file location and exported methods
4. Caches this routing table

### Why Route File Isn't Found

Possible reasons:
1. **Dev server not restarted** ← MOST LIKELY (happens after adding/moving route files)
2. File has syntax error (import fails during load)
3. .next cache is corrupted
4. File permissions issue
5. TypeScript compilation error

## Complete Debugging Checklist

- [ ] Stop dev server (Ctrl+C)
- [ ] Delete `.next` directory
- [ ] Restart dev server (`npm run dev`)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check Network tab for 200 response
- [ ] Verify response JSON structure
- [ ] Check browser console for errors
- [ ] Check server terminal logs for errors

## If Still Failing

If the route still returns 404:

### Check Server Logs
Look for messages like:
```
✓ Compiled `/api/dashboard/status`  ← Means route is recognized
✗ Compilation error in /api/dashboard/status/route.ts  ← Means there's a syntax error
```

### Check Next.js Build
```bash
npm run build
```

Compiler will show exact line of error if import is broken or syntax is invalid.

### Test with curl
```bash
curl "http://localhost:3000/api/dashboard/status?branchId=test-id&restaurantId=test-id"
```

Should return error response (not 404), like:
```json
{
  "success": false,
  "message": "branchId and restaurantId are required",
  "error": { "code": "MISSING_PARAMS" }
}
```

If you get `Cannot GET /api/dashboard/status`, then route is truly not found.

## Route Verification

The route file at `app/api/dashboard/status/route.ts` is correctly structured:

✓ **File Location**: `app/api/dashboard/status/route.ts`
✓ **Expected URL**: `GET/PATCH /api/dashboard/status`
✓ **Exports**: `async function GET()` and `async function PATCH()`
✓ **Imports**: All resolvable
✓ **Dependencies**: All exist

## Next Steps

1. Restart your dev server completely
2. Wait for compilation to finish
3. Check Network tab in DevTools
4. Try loading dashboard again
5. If still broken, check server terminal for errors

---

**The fix is almost certainly: restart the dev server.**

After restart, the route will be recognized and the 404 should disappear.
