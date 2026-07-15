# Deploy Firestore Composite Indexes

## Issue
`FAILED_PRECONDITION: The query requires an index` error when counting customers by date range.

## Root Cause
The `customers` collection query requires a composite index for:
- `organizationId` (equality filter)
- `isDeleted` (equality filter)
- `createdAt` (range filter)

Firestore requires composite indexes when combining multiple equality filters with range filters.

## Solution
Deploy the composite indexes defined in `firestore.indexes.json`

## Deployment Steps

### Option 1: Firebase CLI (Recommended)

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy indexes to your project
firebase deploy --only firestore:indexes
```

### Option 2: Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `restaurant-management-d5c73`
3. Go to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Create the following composite indexes:

#### Index 1: customers collection
- Collection: `customers`
- Fields:
  - `organizationId` (Ascending)
  - `isDeleted` (Ascending)
  - `createdAt` (Descending)

#### Index 2: bills collection
- Collection: `bills`
- Fields:
  - `branchId` (Ascending)
  - `organizationId` (Ascending)
  - `paymentStatus` (Ascending)
  - `createdAt` (Descending)

#### Index 3: orders collection
- Collection: `orders`
- Fields:
  - `branchId` (Ascending)
  - `organizationId` (Ascending)
  - `createdAt` (Descending)

### Option 3: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `restaurant-management-d5c73`
3. Go to **Firestore** → **Indexes**
4. Create composite indexes as described in Option 2

## Verification

After deployment (may take 5-10 minutes):

1. The dashboard should no longer show the index error
2. `countByDateRange()` queries will work correctly
3. Dashboard KPI queries will complete successfully

## Index Composition

### Customers Index
```
organizationId (==) AND isDeleted (==) AND createdAt (range)
```
Used by: `calculateNewGuests()` KPI query

### Bills Index
```
branchId (==) AND organizationId (==) AND paymentStatus (==) AND createdAt (range)
```
Used by: `calculateRevenue()` KPI query

### Orders Index
```
branchId (==) AND organizationId (==) AND createdAt (range)
```
Used by: `calculateOrders()` KPI query

## Why Composite Indexes Are Required

Firestore uses composite indexes when a query has:
- 2+ equality filters on different fields
- At least 1 range filter (`>`, `<`, `>=`, `<=`)

This is a Firestore limitation to ensure query performance and consistency.

## Status After Deployment

Once deployed, you'll see in Firebase Console:
- ✅ Index enabled and indexed
- ✅ Query latency optimized
- ✅ Dashboard errors resolved

---

**Deploy this immediately to fix the dashboard KPI errors.**
