# Duplicate API Requests - Root Cause Analysis

## Summary

Dashboard is making **5+ repeated API calls** to:
- `/api/dashboard/kpis`
- `/api/dashboard/header`
- `/api/dashboard/status`

This is caused by **infinite dependency loops in custom hooks** combined with **React Strict Mode double-renders**.

---

## Root Causes

### Issue #1: useDashboardHeader - Callback Dependency Loop

**File**: `hooks/useDashboardHeader.ts`

```typescript
const refetch = useCallback(async () => {
  // ...
}, [branchId])  // ← branchId as dependency

useEffect(() => {
  refetch()
}, [refetch])  // ← Effect depends on refetch
```

**Problem**:
1. `refetch` is created with `useCallback([branchId])` 
2. Effect has `[refetch]` as dependency
3. When effect runs, it calls `refetch`
4. If branchId changes, `refetch` is recreated
5. New `refetch` triggers effect again
6. In React StrictMode: Effect runs, then cleanup, then effect runs again
7. Result: **Multiple API calls**

### Issue #2: useDashboardKPIs - Callback Dependency Loop

**File**: `hooks/useDashboardKPIs.ts`

```typescript
const fetchKPIs = useCallback(async () => {
  // ...
}, [branchId])  // ← Created with dependency

useEffect(() => {
  // ...
  startPolling()
}, [enabled, branchId, pollInterval, fetchKPIs])  // ← fetchKPIs in deps
```

**Problem**:
- Same as Issue #1
- `fetchKPIs` is recreated when `branchId` changes
- This triggers the effect re-run
- In StrictMode, this multiplies the effect runs

### Issue #3: useRestaurantStatus - Same Problem

**File**: `hooks/useRestaurantStatus.ts`

```typescript
const refresh = useCallback(async () => {
  // ...
}, [branchId, restaurantId])

useEffect(() => {
  refresh()
}, [refresh])  // ← Loop
```

### Issue #4: React Strict Mode Double-Renders

In development, React Strict Mode intentionally double-invokes effects to find bugs.

With broken dependency arrays, this becomes:
1. First effect run: Calls API
2. Cleanup: Nothing happens
3. Second effect run: Calls API again
4. Re-render: State changes
5. Effect runs again due to dependency change
6. Result: 5-6 API calls per page load

---

## Symptoms

- Dashboard page renders 5+ times
- Console logs show multiple fetch starts
- Network tab shows 3-5 identical requests
- Each request takes 2-3 seconds (slow Firestore queries)
- Total load time: 15+ seconds

---

## Solution

### Fix Pattern: Don't include callbacks in effect dependencies

**Instead of**:
```typescript
const fetch = useCallback(async () => {...}, [dep])
useEffect(() => { fetch() }, [fetch])  // ❌ Loop
```

**Use**:
```typescript
const fetch = useCallback(async () => {...}, [dep])
useEffect(() => { fetch() }, [dep])  // ✅ Direct dependency
```

Or better yet, **use the abortable fetch pattern**:
```typescript
useEffect(() => {
  const controller = new AbortController()
  const fetch = async () => {...}
  fetch()
  return () => controller.abort()
}, [dep])  // ✅ No callback in deps
```

---

## Files to Fix

1. `hooks/useDashboardHeader.ts` - Remove `refetch` from effect dependency
2. `hooks/useDashboardKPIs.ts` - Remove `fetchKPIs` from effect dependency  
3. `hooks/useRestaurantStatus.ts` - Remove `refresh` from effect dependency

---

## Expected Behavior After Fix

- ✅ Dashboard page renders 1-2 times (Strict Mode: 2 times)
- ✅ Each API called exactly once on mount
- ✅ No duplicate Firestore queries
- ✅ Load time: 3-4 seconds (one fetch cycle)
- ✅ No infinite loops in production or development

