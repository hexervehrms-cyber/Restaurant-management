# Authentication System — Quick Reference Guide

## How to Use the Auth System

### 1. Access Current User in Components

```typescript
'use client'

import { useAuth } from '@/context/AuthContext'

export default function MyComponent() {
  const { user, userProfile, isAuthenticated, error } = useAuth()

  if (!isAuthenticated) {
    return <div>Not logged in</div>
  }

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Name: {userProfile?.firstName} {userProfile?.lastName}</p>
      <p>Role: {userProfile?.role}</p>
    </div>
  )
}
```

### 2. Perform Login Programmatically

```typescript
const { login } = useAuth()

try {
  await login('user@example.com', 'password123', true) // Remember me
  // Automatically redirected on success
} catch (error) {
  console.error(error.message)
}
```

### 3. Perform Logout Programmatically

```typescript
const { logout } = useAuth()
const router = useRouter()

async function handleLogout() {
  await logout()
  router.push('/login')
}
```

### 4. Reset Password

```typescript
const { resetPassword } = useAuth()

try {
  await resetPassword('user@example.com')
  // Firebase sends password reset email
  alert('Check your email for password reset link')
} catch (error) {
  alert(error.message)
}
```

### 5. Check If User is Authenticated

```typescript
const { isAuthenticated, loading } = useAuth()

if (loading) {
  return <div>Checking authentication...</div>
}

if (!isAuthenticated) {
  return <div>Please log in</div>
}

return <div>Welcome!</div>
```

---

## Available Context Properties

```typescript
type AuthContextType = {
  user: User | null                    // Firebase user object
  userProfile: UserProfile | null      // Firestore user document
  loading: boolean                     // Initial auth state check
  profileLoading: boolean              // Profile fetch in progress
  error: string | null                 // Error message
  isAuthenticated: boolean             // user && userProfile exist
  login: (email, password, rememberMe) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email) => Promise<void>
}
```

---

## UserProfile Type

```typescript
interface UserProfile {
  id: string                  // Firestore document ID
  email: string              // User email
  firstName: string          // First name
  lastName: string           // Last name
  role: string               // User role
  status: string             // Account status
  organizationId: string     // Organization ID
  restaurantId: string       // Restaurant ID
  branchId: string           // Branch ID
}
```

---

## Login Page Features

**Location:** `/login`

- Email validation (format + required)
- Password validation (length + required)
- Show/Hide password toggle
- Remember Me checkbox (default checked)
- Forgot Password link
- Demo credentials card (dev only)
- Error messages with friendly copy
- Loading spinners during auth
- Responsive design
- Dark mode support

---

## Forgot Password Flow

**User Steps:**
1. Click "Forgot password?" on login page
2. Enter email in dialog
3. Click "Send Reset Link"
4. Check email for Firebase password reset link
5. Click link and set new password
6. Return to login and use new password

---

## Session Persistence

### Remember Me = Checked (Default)
```
✓ Persists across browser restart
✓ Stored in browser localStorage
✓ Survives OS restart
✗ Less secure on shared devices
```

### Remember Me = Unchecked
```
✓ Clears when browser closes
✓ Session-only storage
✓ Better for shared devices
✗ Must login again after closing browser
```

### What Happens on Page Refresh?
```
With Remember Me ✓
  → Browser refresh → Still logged in ✓

With Remember Me ✗
  → Browser refresh → Still logged in ✓
  → Close browser → Logout ✓
```

---

## Route Protection

**Protected Routes:**
- All routes under `/` (dashboard)
- Automatically redirect to `/login` if not authenticated
- Dashboard only renders after profile loads

**Unprotected Routes:**
- `/login` — Always accessible
- Can also access `/login` while logged in (redirects to dashboard)

---

## Error Messages

### Login Errors
| Scenario | Message |
|----------|---------|
| Invalid email format | "Please enter a valid email address" |
| Missing email | "Email is required" |
| Missing password | "Password is required" |
| Password too short | "Password must be at least 6 characters" |
| Wrong password | "Incorrect password" |
| Account not found | "Email not found" |
| Account disabled | "This account has been disabled" |
| Too many attempts | "Too many failed attempts. Try again later." |
| Network error | Network errors handled gracefully |

### Forgot Password Errors
| Scenario | Message |
|----------|---------|
| Invalid email | "Please enter a valid email address" |
| Missing email | "Email is required" |
| Unknown account | "No account found with this email" |

### Profile Loading Errors
| Scenario | Message |
|----------|---------|
| Profile not found | "User profile not found." |
| Incomplete profile | "User profile incomplete." |
| Firestore error | "Failed to load user profile." |

---

## Development Testing

### Use Demo Credentials

On the login page in development (`NODE_ENV === 'development'`):

1. A "Demo Credentials" card appears
2. Shows the email from `.env`
3. Click "Use Demo Credentials" button
4. Email and password auto-filled
5. Click "Sign In" to login

**Demo Credentials are from:**
```
NEXT_PUBLIC_DEMO_EMAIL=tester@example.com
NEXT_PUBLIC_DEMO_PASSWORD=demo123456
```

**Note:** Update these in `.env` to match your test account in Firebase.

---

## TypeScript Usage

```typescript
import { useAuth } from '@/context/AuthContext'
import type { UserProfile, AuthContextType } from '@/context/AuthContext'

// In component
const authContext: AuthContextType = useAuth()

// Access types
const profile: UserProfile | null = authContext.userProfile
```

---

## Common Patterns

### Protect a Component
```typescript
export default function AdminPanel() {
  const { isAuthenticated, userProfile, loading } = useAuth()

  if (loading) return <Loader />
  if (!isAuthenticated) return <Unauthorized />
  if (userProfile?.role !== 'admin') return <Forbidden />

  return <div>Admin content</div>
}
```

### Login Form Integration
```typescript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [rememberMe, setRememberMe] = useState(true)
const { login, error } = useAuth()

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  try {
    await login(email, password, rememberMe)
  } catch (err) {
    // Error already in context.error
  }
}
```

### Check Role-Based Access
```typescript
const { userProfile } = useAuth()

const canDelete = ['admin', 'manager'].includes(userProfile?.role)

return (
  <button disabled={!canDelete}>
    Delete Item
  </button>
)
```

---

## Debugging

### View Auth State
```typescript
const auth = useAuth()
console.log('Auth State:', {
  user: auth.user?.email,
  profile: auth.userProfile,
  authenticated: auth.isAuthenticated,
  loading: auth.loading,
  error: auth.error
})
```

### Check Firebase Session
```typescript
import { auth } from '@/lib/firebase-client'

console.log('Firebase current user:', auth.currentUser)
```

### Monitor Auth Changes
```typescript
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'

onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user?.email)
})
```

---

## Troubleshooting

### "User not found in Firestore"
**Problem:** Login succeeds but profile doesn't load
**Solution:** 
1. Check Firestore has user document with matching email
2. Verify user has all required fields (organizationId, restaurantId, etc.)
3. Check user status is not 'inactive' or 'suspended'

### "Still logged in after logout"
**Problem:** Logout button clicked but session persists
**Solution:**
1. Check browser's Application → Storage → localStorage
2. Clear the stored session
3. Check browser console for errors
4. Refresh page and try again

### "Demo credentials not working"
**Problem:** Demo credentials button not filling form
**Solution:**
1. Check NODE_ENV is 'development'
2. Check .env file has NEXT_PUBLIC_DEMO_EMAIL and NEXT_PUBLIC_DEMO_PASSWORD
3. Verify credentials in Firebase Authentication
4. Check browser console for errors

### "Session lost on browser restart"
**Problem:** User not logged in after closing browser
**Solution:**
1. Check "Remember Me" was checked during login
2. Check browser didn't clear localStorage on exit
3. Try checking "Remember Me" again and testing

### "Stuck on loading screen"
**Problem:** Dashboard shows loading spinner indefinitely
**Solution:**
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify Firebase credentials in .env
4. Check Firestore user document exists
5. Try logging out and in again

---

## API Reference

### useAuth()
Returns the authentication context with all auth-related state and methods.

**Usage:**
```typescript
const auth = useAuth()
```

**Throws:** Error if used outside AuthProvider

---

### AuthProvider
Wraps the app and provides authentication context to all children.

**Location:** `app/layout.tsx` (already configured)

---

### Login Flow Sequence
```
1. User fills email and password
2. Clicks Sign In button
3. login() called with email, password, rememberMe
4. Firebase.setPersistence() sets storage mode
5. Firebase.signInWithEmailAndPassword() authenticates
6. onAuthStateChanged fires with new user
7. fetchUserProfile() queries Firestore
8. Profile validated for required fields
9. userProfile stored in context
10. Login page useEffect detects userProfile
11. Router redirects to dashboard
12. Dashboard layout confirms auth
13. Dashboard renders with sidebar
```

---

## Security Best Practices

✅ **DO:**
- Always use HTTPS in production
- Keep Firebase credentials in environment variables
- Validate user profile after login
- Check role before sensitive operations
- Use Remember Me appropriately
- Clear session on sensitive operations

❌ **DON'T:**
- Hardcode Firebase credentials
- Store passwords anywhere
- Trust client-side role checks (verify server-side too)
- Log user data to console in production
- Use Remember Me for admin accounts on shared devices
- Bypass authentication checks

---

## Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Support

For issues or questions:
1. Check AUTHENTICATION_IMPLEMENTATION_CHECKLIST.md
2. Review inline JSDoc comments in source files
3. Check browser console and Network tab for errors
4. Review Firebase Console for authentication logs

---

**Last Updated:** July 14, 2026  
**Status:** Production Ready ✅

