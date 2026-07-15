/**
 * Verify Firebase Authentication Setup
 * Checks if test user accounts exist in Firebase Authentication
 * 
 * This script helps diagnose why users might be stuck on the loading screen.
 */

import admin from 'firebase-admin'
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import fs from 'fs'
import path from 'path'

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../credentials/firebase-admin.json'), 'utf-8')
)

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
})

const auth = getAuth(app)

async function verifyAuth() {
  console.log('\n=== Firebase Authentication Verification ===\n')

  const testEmails = [
    'admin@gmail.com',
    'test@gmail.com',
  ]

  for (const email of testEmails) {
    console.log(`\nChecking user: ${email}`)
    try {
      const user = await auth.getUserByEmail(email)
      console.log(`  ✓ Found in Firebase Auth`)
      console.log(`    - UID: ${user.uid}`)
      console.log(`    - Email Verified: ${user.emailVerified}`)
      console.log(`    - Disabled: ${user.disabled}`)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`  ✗ NOT FOUND in Firebase Auth`)
        console.log(`    Action: User needs to sign up or be created with Firebase Admin`)
      } else {
        console.log(`  ✗ Error: ${error.message}`)
      }
    }
  }

  console.log('\n=== Troubleshooting ===\n')
  console.log('If users are not found:')
  console.log('1. Run the seed-auth.ts script to create Firebase auth accounts')
  console.log('2. Or: Use Firebase Console to create test accounts')
  console.log('3. Or: Manually sign up at the login page')
  console.log('\nAfter creating auth accounts, test login with:')
  console.log('  Email: admin@gmail.com')
  console.log('  Password: (your chosen password)')
  console.log('\n')

  process.exit(0)
}

verifyAuth().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
