# How to Get Real Firebase Credentials

## The Problem
The API key in `.env` is a placeholder and not valid. Firebase is rejecting authentication requests because the key doesn't exist in the Firebase project.

## Solution: Get Real Credentials from Firebase Console

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com

### Step 2: Select Your Project
Look for project: **`restaurant-management-d5c73`**

### Step 3: Get Web SDK Configuration
1. Click on "Project Settings" (gear icon) in top-left
2. Go to "Your apps" section
3. Look for your Web app (should say "web" or have a `</>` icon)
4. Click on it to see the config

### Step 4: Copy the Configuration
You should see a code block like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                              // THIS IS WHAT WE NEED
  authDomain: "restaurant-management-d5c73...",
  projectId: "restaurant-management-d5c73",
  storageBucket: "restaurant-management-d5c73...",
  messagingSenderId: "123456...",
  appId: "1:123456:web:abc123..."
};
```

### Step 5: Provide the Real Values
Copy these EXACT values from your Firebase Console:

```
NEXT_PUBLIC_FIREBASE_API_KEY=                    [Copy from Firebase]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=                [Copy from Firebase]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=                 [Copy from Firebase]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=             [Copy from Firebase]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=        [Copy from Firebase]
NEXT_PUBLIC_FIREBASE_APP_ID=                     [Copy from Firebase]
```

## Or: Check if It's Already in Your Files

Sometimes the real config is in:
- Previous `.env.local` files
- Git history
- Deployment logs
- Team documentation
- Firebase Console directly

## What We Need
Provide the following values from your actual Firebase Console for project `restaurant-management-d5c73`:

1. **API Key** (starts with `AIzaSy...`)
2. **Auth Domain** (format: `project-id.firebaseapp.com`)
3. **Project ID** (already have: `restaurant-management-d5c73`)
4. **Storage Bucket** (format: `project-id.appspot.com`)
5. **Messaging Sender ID** (numeric ID)
6. **App ID** (format: `1:number:web:hexstring`)

---

## Alternative: Create Web App in Firebase Console

If no Web app exists:

1. Go to Firebase Console
2. Select `restaurant-management-d5c73` project
3. Click "Add app" (+ button in "Your apps" section)
4. Choose "Web" (`</>`  icon)
5. Register with any name
6. Firebase will generate the config
7. Copy the values

---

## Then Update .env

Once you have the real values, I'll update `.env` with them.

