/**
 * Seed Firebase Authentication
 * Creates test user accounts in Firebase Authentication
 * 
 * Run this AFTER seed-firestore.js to create auth accounts for Firestore users
 * 
 * Command: node backend/seed-firebase-auth.js
 */

const adminLib = require('firebase-admin');
const { cert, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../credentials/firebase-admin.json'), 'utf-8')
);

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const auth = getAuth(app);

// Test users to create
const TEST_USERS = [
  {
    email: 'admin@gmail.com',
    password: '123456',  // Must be at least 6 characters
    displayName: 'Admin User',
    firestoreId: '2862fbcf-b0c3-403d-8e86-5fd1c205d658',  // From seed-firestore.js
  },
  {
    email: 'test@gmail.com',
    password: 'Jadu@123',
    displayName: 'Test User',
    firestoreId: 'test-user-id-' + Date.now(),  // Generated in seed-firestore.js
  },
];

async function seedAuthUsers() {
  try {
    console.log('🔐 FIREBASE AUTHENTICATION SEEDING');
    console.log('='.repeat(60));
    console.log('');

    for (const testUser of TEST_USERS) {
      console.log(`📍 Creating user: ${testUser.email}`);

      try {
        // Check if user already exists
        const existingUser = await auth.getUserByEmail(testUser.email).catch(() => null);

        if (existingUser) {
          console.log(`  ✓ User already exists with UID: ${existingUser.uid}`);
          continue;
        }

        // Create user
        const userRecord = await auth.createUser({
          email: testUser.email,
          password: testUser.password,
          displayName: testUser.displayName,
          emailVerified: false,
        });

        console.log(`  ✓ User created successfully`);
        console.log(`    - Email: ${userRecord.email}`);
        console.log(`    - UID: ${userRecord.uid}`);
        console.log(`    - Password: ${testUser.password}`);
        console.log('');
      } catch (error) {
        console.error(`  ✗ Failed to create user: ${error.message}`);
        console.error('');
      }
    }

    console.log('='.repeat(60));
    console.log('✅ Firebase Auth Seeding Complete');
    console.log('');
    console.log('Test Credentials:');
    TEST_USERS.forEach((user) => {
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });

    console.log('Next Steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Navigate to: http://localhost:3000/login');
    console.log('  3. Login with test credentials above');
    console.log('  4. Dashboard should load with real KPI data');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Firebase Auth:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

seedAuthUsers();
