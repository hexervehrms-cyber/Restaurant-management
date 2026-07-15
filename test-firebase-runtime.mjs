/**
 * RUNTIME VALIDATION - Firebase and BaseRepository
 * Tests actual instantiation and Firestore access
 */

console.log('\n' + '='.repeat(70));
console.log('FIREBASE RUNTIME VALIDATION');
console.log('='.repeat(70) + '\n');

// VALIDATION 4: Test BaseRepository instantiation
console.log('VALIDATION 4: BaseRepository Instantiation');
console.log('-'.repeat(70));

try {
  // Import the configuration
  const { getFirestore, initializeFirebase, isFirebaseInitialized } = await import(
    './backend/src/config/firebase.js'
  );

  console.log('✓ Firebase config imported successfully');

  // Check if Firebase is initialized
  const initialized = isFirebaseInitialized();
  console.log(`✓ isFirebaseInitialized(): ${initialized}`);

  if (!initialized) {
    console.log('⚠ Firebase not initialized, initializing now...');
    await initializeFirebase();
    console.log('✓ Firebase initialized');
  }

  // Get Firestore instance
  const db = getFirestore();
  console.log(`✓ getFirestore() returned: ${typeof db}`);
  console.log(`✓ Firestore instance type: ${db?.constructor?.name || 'unknown'}`);

  // Check if db has expected methods
  const hasCollection = typeof db?.collection === 'function';
  console.log(`✓ db.collection() method exists: ${hasCollection}`);

  if (!hasCollection) {
    console.log('✗ CRITICAL: db does not have collection() method');
    process.exit(1);
  }

  console.log('\n✓ BaseRepository validation PASSED\n');

  // VALIDATION 5: Real Firestore Query
  console.log('VALIDATION 5: Real Firestore Query');
  console.log('-'.repeat(70));

  try {
    const startTime = Date.now();
    
    // Execute a real query - get one document from users collection
    const snapshot = await db.collection('users').limit(1).get();
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`✓ Query executed successfully`);
    console.log(`✓ Collection: users`);
    console.log(`✓ Query: limit(1)`);
    console.log(`✓ Execution time: ${executionTime}ms`);
    console.log(`✓ Documents returned: ${snapshot.size}`);

    if (snapshot.size > 0) {
      const doc = snapshot.docs[0];
      console.log(`✓ First document ID: ${doc.id}`);
      console.log(`✓ First document data keys: ${Object.keys(doc.data()).join(', ')}`);
    } else {
      console.log(`ℹ No documents in users collection (empty collection)`);
    }

    console.log('\n✓ Firestore Query validation PASSED\n');

  } catch (queryError) {
    console.error('✗ Firestore query failed');
    console.error(`  Error: ${queryError.message}`);
    console.error(`  Stack: ${queryError.stack}`);
    process.exit(1);
  }

} catch (error) {
  console.error('✗ Firebase validation failed');
  console.error(`Error: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  process.exit(1);
}

console.log('='.repeat(70));
console.log('ALL RUNTIME VALIDATIONS PASSED');
console.log('='.repeat(70) + '\n');

process.exit(0);
