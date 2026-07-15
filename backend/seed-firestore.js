const adminLib = require('firebase-admin');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

const firestore = getFirestore(app);

// Mock auth IDs from backend/api/middleware/auth.ts
const MOCK_IDS = {
  userId: '2862fbcf-b0c3-403d-8e86-5fd1c205d658',
  organizationId: 'b8f51aa9-32c3-482d-9e26-989ba5816bc4',
  restaurantId: 'fb8e6830-45a9-4586-9370-1e2a7936952a',
  branchId: '829b1e49-87b3-4cc9-a4a9-4e719bf4440c',
};

async function seedFirestore() {
  try {
    console.log('🌱 FIRESTORE BOOTSTRAP - PHASE 3');
    console.log('='.repeat(60));
    console.log('');

    const now = new Date();
    let batch = firestore.batch();
    let operationCount = 0;

    // 1. Create Organization
    console.log('📍 [1/5] Creating Organization...');
    const orgRef = firestore.collection('organizations').doc(MOCK_IDS.organizationId);
    batch.set(orgRef, {
      id: MOCK_IDS.organizationId,
      name: 'Hexerve HRMS',
      slug: 'hexerve-hrms',
      description: 'Restaurant Management System',
      email: 'info@hexerve.com',
      phone: '+91-9876543210',
      status: 'active',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: MOCK_IDS.userId,
      updatedBy: MOCK_IDS.userId,
    });
    operationCount++;
    console.log(`  ✓ Organization: ${MOCK_IDS.organizationId}`);

    // 2. Create Users (admin and test accounts)
    console.log('📍 [2/5] Creating Users...');
    
    // Primary admin user (for testing with admin@gmail.com)
    const adminUserRef = firestore.collection('users').doc(MOCK_IDS.userId);
    batch.set(adminUserRef, {
      id: MOCK_IDS.userId,
      email: 'admin@gmail.com',  // Test credentials
      firebaseUid: 'test-admin-uid',  // Placeholder - will be set by user
      firstName: 'Admin',
      lastName: 'User',
      phone: '+91-9876543210',
      organizationId: MOCK_IDS.organizationId,
      restaurantId: MOCK_IDS.restaurantId,
      branchId: MOCK_IDS.branchId,
      role: 'restaurant_owner',
      status: 'active',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: MOCK_IDS.userId,
      updatedBy: MOCK_IDS.userId,
    });
    operationCount++;
    console.log(`  ✓ User (Admin): ${MOCK_IDS.userId}`);

    // Secondary test user (for testing with test@gmail.com)
    const testUserRef = firestore.collection('users').doc('test-user-id-' + Date.now());
    batch.set(testUserRef, {
      id: 'test-user-id-' + Date.now(),
      email: 'test@gmail.com',  // Secondary test credentials
      firebaseUid: 'test-user-uid',  // Placeholder - will be set by user
      firstName: 'Test',
      lastName: 'User',
      phone: '+91-9876543211',
      organizationId: MOCK_IDS.organizationId,
      restaurantId: MOCK_IDS.restaurantId,
      branchId: MOCK_IDS.branchId,
      role: 'manager',
      status: 'active',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: MOCK_IDS.userId,
      updatedBy: MOCK_IDS.userId,
    });
    operationCount++;
    console.log(`  ✓ User (Test): test@gmail.com`);

    // 3. Create Restaurant
    console.log('📍 [3/5] Creating Restaurant...');
    const restaurantRef = firestore.collection('restaurants').doc(MOCK_IDS.restaurantId);
    batch.set(restaurantRef, {
      id: MOCK_IDS.restaurantId,
      name: 'Hexerve Restaurant',
      slug: 'hexerve-restaurant',
      description: 'Premium Dining Experience',
      organizationId: MOCK_IDS.organizationId,
      status: 'active',
      isDeleted: false,
      cuisineType: 'multi-cuisine',
      rating: 4.5,
      createdAt: now,
      updatedAt: now,
      createdBy: MOCK_IDS.userId,
      updatedBy: MOCK_IDS.userId,
    });
    operationCount++;
    console.log(`  ✓ Restaurant: ${MOCK_IDS.restaurantId}`);

    // 4. Create Branch
    console.log('📍 [4/5] Creating Branch...');
    const branchRef = firestore.collection('branches').doc(MOCK_IDS.branchId);
    batch.set(branchRef, {
      id: MOCK_IDS.branchId,
      name: 'Main Branch',
      restaurantId: MOCK_IDS.restaurantId,
      organizationId: MOCK_IDS.organizationId,
      isPrimary: true,
      address: '123 Food Street, City',
      phone: '+91-9876543210',
      email: 'branch@hexerve.com',
      status: 'active',
      isDeleted: false,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: MOCK_IDS.userId,
      updatedBy: MOCK_IDS.userId,
    });
    operationCount++;
    console.log(`  ✓ Branch: ${MOCK_IDS.branchId}`);

    // 5. Create Restaurant Settings
    console.log('📍 [5/5] Creating Restaurant Settings...');
    const settingsRef = firestore.collection('restaurantSettings').doc(MOCK_IDS.restaurantId);
    batch.set(settingsRef, {
      id: MOCK_IDS.restaurantId,
      restaurantId: MOCK_IDS.restaurantId,
      organizationId: MOCK_IDS.organizationId,
      branchId: MOCK_IDS.branchId,
      businessHours: {
        monday: { open: '09:00', close: '23:00', isOpen: true },
        tuesday: { open: '09:00', close: '23:00', isOpen: true },
        wednesday: { open: '09:00', close: '23:00', isOpen: true },
        thursday: { open: '09:00', close: '23:00', isOpen: true },
        friday: { open: '09:00', close: '23:00', isOpen: true },
        saturday: { open: '10:00', close: '24:00', isOpen: true },
        sunday: { open: '10:00', close: '23:00', isOpen: true },
      },
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      language: 'en',
      theme: 'light',
      taxPercentage: 18,
      serviceChargePercentage: 0,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      createdBy: MOCK_IDS.userId,
      updatedBy: MOCK_IDS.userId,
    });
    operationCount++;
    console.log(`  ✓ Restaurant Settings: ${MOCK_IDS.restaurantId}`);

    // Commit the batch
    await batch.commit();
    console.log('');
    console.log('✅ Batch committed successfully');
    console.log(`   Operations: ${operationCount}`);
    console.log('');

    console.log('='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    console.log('Collections Created:');
    console.log('  1. organizations (1 document)');
    console.log('  2. users (2 documents - admin@gmail.com, test@gmail.com)');
    console.log('  3. restaurants (1 document)');
    console.log('  4. branches (1 document)');
    console.log('  5. restaurantSettings (1 document)');
    console.log('');
    console.log('Test User Accounts:');
    console.log('  1. admin@gmail.com (Password: 1234)');
    console.log('  2. test@gmail.com (Password: Jadu@123)');
    console.log('');
    console.log('Document IDs Used:');
    console.log(`  Organization: ${MOCK_IDS.organizationId}`);
    console.log(`  Admin User: ${MOCK_IDS.userId}`);
    console.log(`  Restaurant: ${MOCK_IDS.restaurantId}`);
    console.log(`  Branch: ${MOCK_IDS.branchId}`);
    console.log('');
    console.log('Foreign-Key Relationships:');
    console.log('  organizations → users (organizationId)');
    console.log('  users → restaurants (restaurantId)');
    console.log('  restaurants → branches (restaurantId)');
    console.log('  branches → restaurantSettings (branchId)');
    console.log('');
    console.log('✅ Firestore Bootstrap Complete');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Test: GET /api/dashboard/header');
    console.log('  3. Verify: No "User not found" errors');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Firestore:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Ensure credentials/firebase-admin.json exists');
    console.error('  2. Verify Firebase project is active');
    console.error('  3. Check Firestore is enabled in Firebase Console');
    process.exit(1);
  }
}

seedFirestore();
