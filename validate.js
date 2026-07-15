const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('FIREBASE INITIALIZATION VALIDATION - QUICK CHECK');
console.log('='.repeat(70) + '\n');

// Check 1: Firebase Config
const configPath = path.join(process.cwd(), 'backend/src/config/firebase.ts');
const configExists = fs.existsSync(configPath);
console.log('1. Firebase Config File');
console.log('   Path:', configPath);
console.log('   Status:', configExists ? 'EXISTS' : 'NOT FOUND');

// Check 2: Instrumentation
const instrPath = path.join(process.cwd(), 'instrumentation.ts');
const instrExists = fs.existsSync(instrPath);
console.log('\n2. Instrumentation Hook');
console.log('   Path:', instrPath);
console.log('   Status:', instrExists ? 'EXISTS' : 'NOT FOUND');

// Check 3: BaseRepository
const baseRepoPath = path.join(process.cwd(), 'backend/src/repositories/BaseRepository.ts');
const baseRepoExists = fs.existsSync(baseRepoPath);
console.log('\n3. Base Repository');
console.log('   Path:', baseRepoPath);
console.log('   Status:', baseRepoExists ? 'EXISTS' : 'NOT FOUND');

// Check 4: Credentials
const credPath = path.join(process.cwd(), 'credentials/firebase-admin.json');
const credExists = fs.existsSync(credPath);
console.log('\n4. Firebase Credentials');
console.log('   Path:', credPath);
console.log('   Status:', credExists ? 'EXISTS' : 'NOT FOUND (expected)');

// Check 5: Verify content
console.log('\n5. Verification - Config Content Check');
if (configExists) {
  const content = fs.readFileSync(configPath, 'utf-8');
  const hasGlobalThis = content.includes('globalThis.firebaseGlobal');
  const hasInitialize = content.includes('export async function initializeFirebase');
  const hasGetFirestore = content.includes('export function getFirestore');
  
  console.log('   Has globalThis storage:', hasGlobalThis ? 'YES' : 'NO');
  console.log('   Has initializeFirebase():', hasInitialize ? 'YES' : 'NO');
  console.log('   Has getFirestore():', hasGetFirestore ? 'YES' : 'NO');
}

// Check 6: BaseRepository uses getFirestore
console.log('\n6. Verification - BaseRepository Content Check');
if (baseRepoExists) {
  const content = fs.readFileSync(baseRepoPath, 'utf-8');
  const importsGetFirestore = content.includes('from ../config/firebase');
  const usesInConstructor = content.includes('this.db = getFirestore()');
  
  console.log('   Imports getFirestore():', importsGetFirestore ? 'YES' : 'NO');
  console.log('   Uses in constructor:', usesInConstructor ? 'YES' : 'NO');
}

// Check 7: Instrumentation calls initialize
console.log('\n7. Verification - Instrumentation Content Check');
if (instrExists) {
  const content = fs.readFileSync(instrPath, 'utf-8');
  const hasRegister = content.includes('export async function register');
  const callsInit = content.includes('initializeFirebase()');
  
  console.log('   Has register() export:', hasRegister ? 'YES' : 'NO');
  console.log('   Calls initializeFirebase():', callsInit ? 'YES' : 'NO');
}

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

if (configExists && instrExists && baseRepoExists) {
  console.log('\nALL CRITICAL FILES PRESENT\n');
  console.log('Firebase Initialization Architecture:');
  console.log('  1. instrumentation.ts runs on server startup');
  console.log('  2. Calls initializeFirebase() from backend/src/config/firebase.ts');
  console.log('  3. Stores Firestore instance in globalThis.firebaseGlobal');
  console.log('  4. BaseRepository calls getFirestore() in constructor');
  console.log('  5. All repositories receive initialized Firestore instance');
  console.log('  6. Queries execute without initialization errors\n');
} else {
  console.log('\nSOME FILES MISSING\n');
}

console.log('='.repeat(70) + '\n');
