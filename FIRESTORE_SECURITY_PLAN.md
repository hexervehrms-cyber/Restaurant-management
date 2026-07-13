# Phase 6.1.2 – Firestore Security Architecture
**Date:** July 13, 2026  
**Status:** DESIGN ONLY  
**Purpose:** Define security rules, access control, and multi-tenant isolation  

---

## Security Model Overview

### Principles

1. **Multi-Tenant Isolation** - Complete data separation by `organizationId`
2. **Role-Based Access Control (RBAC)** - Firebase custom claims for roles
3. **Principle of Least Privilege** - Grant minimum required permissions
4. **Deny by Default** - Explicitly allow only required operations
5. **Server-Side Validation** - Security rules are first line, app validates too

---

## Authentication Model

### User Authentication Flow

```
1. User enters credentials
2. Firebase Auth validates (email/password, phone OTP, social login)
3. JWT token issued with custom claims
4. Token includes:
   - uid (user ID)
   - email
   - custom.organizationId
   - custom.role
   - custom.restaurantId (if applicable)
5. Token presented to Firestore in every request
6. Firestore verifies token and claims
```

### Custom Claims

Firebase custom claims added to user tokens:

```json
{
  "organizationId": "org-123",
  "role": "restaurant_owner",
  "restaurantId": "rest-123",
  "staffId": "staff-456",
  "permissions": ["orders.view", "orders.create", "bills.view"]
}
```

### Role Hierarchy

```
super_admin
  └─ Can: Everything
  └─ Scope: All organizations

restaurant_owner
  └─ Can: Manage restaurant, staff, menu, orders
  └─ Scope: Single organization

branch_manager
  └─ Can: Manage branch, take orders, manage staff
  └─ Scope: Single branch

chef
  └─ Can: View kitchen tickets, update status
  └─ Scope: Single branch kitchen

waiter
  └─ Can: Create orders, view tables, take payments
  └─ Scope: Single branch

cashier
  └─ Can: View bills, process payments, refunds
  └─ Scope: Single branch

customer
  └─ Can: View own orders, reservations, loyalty
  └─ Scope: Own data only

aggregator_integration
  └─ Can: Create/update orders, webhooks
  └─ Scope: Single organization orders
```

---

## Firestore Security Rules

### Rule Structure

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             request.auth.token.role == 'super_admin';
    }
    
    function getUserOrg() {
      return request.auth.token.organizationId;
    }
    
    function getUserRole() {
      return request.auth.token.role;
    }
    
    // Collection rules
    match /organizations/{orgId} {
      // ... rules for this collection
    }
  }
}
```

### ORGANIZATIONS Collection Rules

```
match /organizations/{orgId} {
  // List organizations
  allow list: if isSignedIn() && 
              getUserRole() == 'super_admin';
  
  // Get own organization
  allow get: if isSignedIn() && 
             (getUserOrg() == orgId || getUserRole() == 'super_admin');
  
  // Create (super admin only)
  allow create: if isSignedIn() && getUserRole() == 'super_admin' &&
                request.resource.data.keys().hasAll(['name', 'slug', 'email']);
  
  // Update own organization (org admin)
  allow update: if isSignedIn() && 
                (getUserOrg() == orgId && getUserRole() == 'restaurant_owner') ||
                getUserRole() == 'super_admin';
  
  // Delete (super admin only)
  allow delete: if isSignedIn() && getUserRole() == 'super_admin';
  
  // Nested collections in org
  match /restaurants/{restId} {
    allow get, list: if isSignedIn() && getUserOrg() == orgId;
    // ... etc
  }
}
```

### USERS Collection Rules

```
match /users/{userId} {
  // Users can read own profile
  allow get: if isSignedIn() && (request.auth.uid == userId || 
                                  getUserRole() == 'super_admin');
  
  // List users in same organization
  allow list: if isSignedIn() && 
              resource.data.organizationId == getUserOrg();
  
  // Create new user (org admin)
  allow create: if isSignedIn() && 
                request.resource.data.organizationId == getUserOrg() &&
                request.auth.uid == userId;
  
  // Update own user (limited fields)
  allow update: if isSignedIn() && 
                request.auth.uid == userId &&
                !('organizationId' in request.resource.data.diff().affectedKeys()) &&
                !('role' in request.resource.data.diff().affectedKeys());
  
  // Manager can update staff in organization
  allow update: if isSignedIn() && 
                getUserRole() == 'branch_manager' &&
                resource.data.organizationId == getUserOrg();
  
  // Org admin full control of users
  allow update, delete: if isSignedIn() && 
                        getUserRole() == 'restaurant_owner' &&
                        resource.data.organizationId == getUserOrg();
}
```

### ORDERS Collection Rules

```
match /organizations/{orgId}/restaurants/{restId}/branches/{branchId}/orders/{orderId} {
  // Anyone in org can view orders
  allow get, list: if isSignedIn() && getUserOrg() == orgId;
  
  // Create order: waiter or system
  allow create: if isSignedIn() && 
                getUserOrg() == orgId &&
                (getUserRole() in ['waiter', 'cashier', 'restaurant_owner']) &&
                request.resource.data.organizationId == orgId;
  
  // Update order: creator or manager+
  allow update: if isSignedIn() && 
                getUserOrg() == orgId &&
                (resource.data.createdById == request.auth.uid ||
                 getUserRole() in ['branch_manager', 'restaurant_owner']);
  
  // Nested items in order
  match /items/{itemId} {
    allow get, list, create, update: if isSignedIn() && 
                                      getUserOrg() == orgId;
    
    // Nested modifiers in item
    match /modifiers/{modId} {
      allow get, list, create: if isSignedIn() && getUserOrg() == orgId;
    }
  }
}
```

### BILLS Collection Rules

```
match /organizations/{orgId}/restaurants/{restId}/branches/{branchId}/bills/{billId} {
  // View: anyone in organization
  allow get, list: if isSignedIn() && getUserOrg() == orgId;
  
  // Create: cashier, manager, owner
  allow create: if isSignedIn() && 
                getUserOrg() == orgId &&
                getUserRole() in ['cashier', 'branch_manager', 'restaurant_owner'];
  
  // Update: creator or cashier
  allow update: if isSignedIn() && 
                getUserOrg() == orgId &&
                (resource.data.createdById == request.auth.uid ||
                 getUserRole() in ['cashier', 'branch_manager', 'restaurant_owner']);
  
  // Nested items
  match /items/{itemId} {
    allow get, list, create, update: if isSignedIn() && 
                                      getUserOrg() == orgId;
  }
}
```

### CUSTOMERS Collection Rules

```
match /organizations/{orgId}/customers/{customerId} {
  // Staff can view all customers
  allow get, list: if isSignedIn() && getUserOrg() == orgId;
  
  // Customers can view own profile
  allow get: if isSignedIn() && request.auth.uid == customerId;
  
  // Create customer: waiter, cashier
  allow create: if isSignedIn() && 
                getUserOrg() == orgId &&
                getUserRole() in ['waiter', 'cashier', 'restaurant_owner'];
  
  // Update: creator or self
  allow update: if isSignedIn() && 
                (request.auth.uid == customerId ||
                 (getUserOrg() == orgId && getUserRole() in ['waiter', 'cashier']));
  
  // Nested subcollections
  match /addresses/{addressId} {
    allow get, list: if isSignedIn() && 
                      (request.auth.uid == customerId || 
                       getUserOrg() == orgId);
    allow create, update: if isSignedIn() && 
                          (request.auth.uid == customerId || 
                           (getUserOrg() == orgId && getUserRole() in ['waiter', 'cashier']));
  }
  
  match /notes/{noteId} {
    allow get, list, create: if isSignedIn() && getUserOrg() == orgId;
  }
  
  match /loyalty_points/{document=**} {
    allow get: if isSignedIn() && 
               (request.auth.uid == customerId || 
                getUserOrg() == orgId);
    allow update: if isSignedIn() && getUserOrg() == orgId;
  }
}
```

### KITCHEN_TICKETS Collection Rules

```
match /organizations/{orgId}/restaurants/{restId}/branches/{branchId}/kitchen_sections/{sectionId}/tickets/{ticketId} {
  // Kitchen staff can view tickets in their section
  allow get, list: if isSignedIn() && 
                    getUserOrg() == orgId &&
                    getUserRole() in ['chef', 'waiter', 'manager'];
  
  // Chef can update ticket status
  allow update: if isSignedIn() && 
                getUserOrg() == orgId &&
                getUserRole() == 'chef' &&
                request.resource.data.organizationId == orgId;
  
  // Nested items
  match /items/{itemId} {
    allow get, list, update: if isSignedIn() && getUserOrg() == orgId;
  }
}
```

### MENU_ITEMS Collection Rules

```
match /organizations/{orgId}/restaurants/{restId}/menu_items/{itemId} {
  // Anyone can view menu
  allow get, list: if isSignedIn() && getUserOrg() == orgId;
  
  // Only restaurant owner can modify menu
  allow create, update, delete: if isSignedIn() && 
                                 getUserOrg() == orgId &&
                                 getUserRole() in ['restaurant_owner', 'branch_manager'];
  
  // Nested variants and modifiers
  match /variants/{variantId} {
    allow get, list: if isSignedIn() && getUserOrg() == orgId;
    allow create, update: if isSignedIn() && 
                          getUserOrg() == orgId &&
                          getUserRole() in ['restaurant_owner', 'branch_manager'];
  }
}
```

### NOTIFICATIONS Collection Rules

```
match /organizations/{orgId}/notifications/{notificationId} {
  // Users can read notifications sent to them
  allow get: if isSignedIn() && 
             (request.auth.uid == resource.data.userId ||
              request.auth.token.role == 'super_admin');
  
  // Users can list their own notifications
  allow list: if isSignedIn() && 
              resource.data.userId == request.auth.uid;
  
  // System can create notifications
  allow create: if request.auth.token.role in ['service_account', 'super_admin'];
  
  // Users can update their own (mark read)
  allow update: if isSignedIn() && 
                request.auth.uid == resource.data.userId &&
                request.resource.data.diff().affectedKeys().hasOnly(['isRead', 'readAt']);
}
```

### AUDIT_LOGS Collection Rules

```
match /organizations/{orgId}/audit_logs/{logId} {
  // Org admins can view audit logs
  allow get, list: if isSignedIn() && 
                    getUserOrg() == orgId &&
                    getUserRole() in ['restaurant_owner'];
  
  // System writes audit logs only
  allow create: if request.auth.token.role in ['service_account', 'super_admin'];
  
  // Never update or delete audit logs (append-only)
  allow update, delete: if false;
}
```

---

## API Key Security

### Public API Key (Frontend)

```
// Restrictions:
- Restrict to your domain(s)
- Restrict to Firestore API only
- No Firebase Realtime Database access
- No Cloud Storage access

// In Firebase Console:
Settings → Project Settings → Service Accounts → API Keys
```

### Backend Service Account Key

```
// Use service account for:
- Cloud Functions
- Server-side operations
- Batch operations
- Administrative tasks

// Never commit key to version control
// Store in environment variable or Secret Manager
```

---

## Data Validation

### Client-Side Rules

Firestore rules prevent invalid data at storage layer.

### Additional Application Validation

In Cloud Functions and backend:

```typescript
// Example: Order creation validation
- Verify menuItemId exists and isAvailable
- Validate quantities > 0
- Check customer exists (if provided)
- Verify table is available (if dine-in)
- Confirm payment method is valid
- Validate monetary amounts (non-negative decimals)
```

---

## Encryption

### Data Encryption

- **In Transit:** TLS 1.2+ (automatic for Firestore)
- **At Rest:** AES-256 encryption (default in Firestore)
- **Customer-Managed Keys (CMK):** Available in Firestore for enhanced security

### Sensitive Data Handling

**Never store:**
- Payment card details (use payment gateway)
- Passwords (Firebase Auth handles this)
- Private API keys (use Secret Manager)

**OK to store (encrypted at rest):**
- Customer phone numbers
- Email addresses
- Addresses
- Order history

---

## Access Control Matrix

| Resource | Super Admin | Owner | Manager | Chef | Waiter | Cashier | Customer |
|----------|-----------|-------|---------|------|--------|---------|----------|
| **Organizations** | CRUD | R | R | - | - | - | - |
| **Restaurants** | CRU | CRU | R | R | R | R | - |
| **Branches** | CRU | CRU | CRU | R | R | R | - |
| **Users** | CRUD | CRU | CRU | R | R | R | R (own) |
| **Customers** | R | R | R | - | CR | CR | R (own) |
| **Orders** | R | R | R | R | CR | CR | R (own) |
| **Bills** | R | R | R | - | R | CRUD | R (own) |
| **Payments** | R | R | R | - | - | CR | R (own) |
| **Menu Items** | R | CRU | CRU | R | R | R | R |
| **Tables** | R | R | CRU | - | R | R | - |
| **Kitchen Tickets** | R | R | R | CRU | R | - | - |
| **Reservations** | R | R | CRU | - | R | - | R (own) |
| **Inventory** | R | R | CRU | - | - | - | - |
| **Reports/Analytics** | R | R | R | - | - | - | - |
| **Audit Logs** | R | R | R | - | - | - | - |

Legend: C=Create, R=Read, U=Update, D=Delete, - = No access

---

## Security Monitoring

### Audit Logging

All changes logged in `/audit_logs`:
- WHO made the change (userId)
- WHAT changed (entityType, entityId, field names)
- WHEN it happened (timestamp)
- HOW it changed (oldValues, newValues)

### Security Alerts

Monitor for:
- Failed auth attempts (> 5 in 10 minutes)
- Unauthorized access attempts (404 forbidden patterns)
- Bulk deletions (> 1000 docs in 1 hour)
- Bulk updates to sensitive data
- Unusual data access patterns

### Compliance

**Supports:**
- GDPR (data ownership, deletion)
- PCI DSS (payment security)
- SOC 2 (audit logs, encryption)
- ISO 27001 (information security)

---

## Multi-Tenancy Security

### Tenant Isolation Enforcement

Every query includes:
```typescript
WHERE organizationId == getUserOrg()
```

This prevents cross-org data leaks.

### Logical Deletion Protection

Soft deletes don't expose data:
- Deleted data flagged with `isDeleted: true`
- Queries automatically exclude deleted records
- Historical audit retained for compliance

---

## Security Incident Response

### Steps if Breach Suspected

1. **Containment:** Immediately revoke affected user credentials
2. **Investigation:** Check audit logs for unauthorized access
3. **Notification:** Alert affected customers per legal requirements
4. **Remediation:** Update security rules, change credentials
5. **Recovery:** Restore from backups if needed

### Backup & Recovery

- Daily automated backups (Firestore automatic)
- Retain backups for 90 days
- Document recovery procedures
- Test recovery quarterly

