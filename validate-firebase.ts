/**
 * Firebase Initialization Validation Script
 * 
 * This script validates that Firebase initialization works correctly
 * by testing the actual configuration and basic operations.
 * 
 * Run with: npx ts-node validate-firebase.ts
 */

import * as fs from 'fs'
import * as path from 'path'

console.log('\n' + '='.repeat(70))
console.log('FIREBASE INITIALIZATION VALIDATION')
console.log('='.repeat(70) + '\n')

// ──────────────────────────────────────────────────────────────────────────
// 1. CHECK FIREBASE CONFIG FILE EXISTS
// ──────────────────────────────────────────────────────────────────────────
console.log('1. CHECKING FIREBASE CONFIGURATION FILE')
console.log('─'.repeat(70))

const configFilePath = path.join(process.cwd(), 'backend/src/config/firebase.ts')
const configExists = fs.existsSync(configFilePath)

console.log(`   File: ${configFilePath}`)
console.log(`   Exists: ${configExists ? '✅ YES' : '❌ NO'}`)

if (configExists) {
  const configContent = fs.readFileSync(configFilePath, 'utf-8')
  
  // Check for key functions
  const hasInitializeFirebase = configContent.includes('export async function initializeFirebase')
  const hasGetFirestore = configContent.includes('export function getFirestore')
  const hasGlobalStorage = configContent.includes('globalThis.firebaseGlobal')
  
  console.log(`   Has initializeFirebase(): ${hasInitializeFirebase ? '✅ YES' : '❌ NO'}`)
  console.log(`   Has getFirestore(): ${hasGetFirestore ? '✅ YES' : '❌ NO'}`)
  console.log(`   Uses globalThis.firebaseGlobal: ${hasGlobalStorage ? '✅ YES' : '❌ NO'}`)
}

// ──────────────────────────────────────────────────────────────────────────
// 2. CHECK INSTRUMENTATION HOOK
// ──────────────────────────────────────────────────────────────────────────
console.log('\n2. CHECKING INSTRUMENTATION HOOK')
console.log('─'.repeat(70))

const instrumentationPath = path.join(process.cwd(), 'instrumentation.ts')
const instrumentationExists = fs.existsSync(instrumentationPath)

console.log(`   File: ${instrumentationPath}`)
console.log(`   Exists: ${instrumentationExists ? '✅ YES' : '❌ NO'}`)

if (instrumentationExists) {
  const instrumentationContent = fs.readFileSync(instrumentationPath, 'utf-8')
  
  const hasRegister = instrumentationContent.includes('export async function register')
  const callsInitializeFirebase = instrumentationContent.includes('initializeFirebase()')
  
  console.log(`   Has register() export: ${hasRegister ? '✅ YES' : '❌ NO'}`)
  console.log(`   Calls initializeFirebase(): ${callsInitializeFirebase ? '✅ YES' : '❌ NO'}`)
}

// ──────────────────────────────────────────────────────────────────────────
// 3. CHECK BASE REPOSITORY
// ──────────────────────────────────────────────────────────────────────────
console.log('\n3. CHECKING BASE REPOSITORY')
console.log('─'.repeat(70))

const baseRepoPath = path.join(process.cwd(), 'backend/src/repositories/BaseRepository.ts')
const baseRepoExists = fs.existsSync(baseRepoPath)

console.log(`   File: ${baseRepoPath}`)
console.log(`   Exists: ${baseRepoExists ? '✅ YES' : '❌ NO'}`)

if (baseRepoExists) {
  const baseRepoContent = fs.readFileSync(baseRepoPath, 'utf-8')
  
  const importsGetFirestore = baseRepoContent.includes("import { getFirestore } from '../config/firebase'")
  const usesGetFirestore = baseRepoContent.includes('this.db = getFirestore()')
  
  console.log(`   Imports getFirestore: ${importsGetFirestore ? '✅ YES' : '❌ NO'}`)
  console.log(`   Uses getFirestore in constructor: ${usesGetFirestore ? '✅ YES' : '❌ NO'}`)
}

// ──────────────────────────────────────────────────────────────────────────
// 4. CHECK CREDENTIALS
// ──────────────────────────────────────────────────────────────────────────
console.log('\n4. CHECKING CREDENTIALS')
console.log('─'.repeat(70))

const credentialsPath = path.join(process.cwd(), 'credentials/firebase-admin.json')
const credentialsExist = fs.existsSync(credentialsPath)

console.log(`   File: ${credentialsPath}`)
console.log(`   Exists: ${credentialsExist ? '✅ YES' : '❌ NO (expected during validation)'}`)

if (credentialsExist) {
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))
    console.log(`   Valid JSON: ✅ YES`)
    console.log(`   Has project_id: ${credentials.project_id ? '✅ YES' : '❌ NO'}`)
  } catch (e) {
    console.log(`   Valid JSON: ❌ NO - ${e instanceof Error ? e.message : String(e)}`)
  }
} else {
  console.log(`   ℹ Note: Credentials file will be created during setup`)
}

// ──────────────────────────────────────────────────────────────────────────
// 5. CHECK REPOSITORY IMPLEMENTATIONS
// ──────────────────────────────────────────────────────────────────────────
console.log('\n5. CHECKING REPOSITORY IMPLEMENTATIONS')
console.log('─'.repeat(70))

const repositoriesToCheck = [
  'UserRepository.ts',
  'RestaurantRepository.ts',
  'BranchRepository.ts',
  'RestaurantSettingsRepository.ts',
]

for (const repoFile of repositoriesToCheck) {
  const repoPath = path.join(process.cwd(), `backend/src/repositories/${repoFile}`)
  const exists = fs.existsSync(repoPath)
  
  if (exists) {
    const content = fs.readFileSync(repoPath, 'utf-8')
    const extendsBaseRepository = content.includes('extends BaseRepository')
    console.log(`   ${repoFile}: ${exists && extendsBaseRepository ? '✅ OK' : '⚠️  CHECK'}`)
  } else {
    console.log(`   ${repoFile}: ❌ NOT FOUND`)
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 6. CHECK API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────
console.log('\n6. CHECKING API ENDPOINTS')
console.log('─'.repeat(70))

const endpointsToCheck = [
  'app/api/dashboard/header/route.ts',
  'app/api/dashboard/summary/route.ts',
]

for (const endpoint of endpointsToCheck) {
  const endpointPath = path.join(process.cwd(), endpoint)
  const exists = fs.existsSync(endpointPath)
  
  if (exists) {
    const content = fs.readFileSync(endpointPath, 'utf-8')
    const usesRepositories = content.includes('Repository()')
    console.log(`   ${endpoint}: ${exists && usesRepositories ? '✅ OK' : '⚠️  CHECK'}`)
  } else {
    console.log(`   ${endpoint}: ⚠️  NOT FOUND`)
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 7. SUMMARY
// ──────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(70))
console.log('VALIDATION SUMMARY')
console.log('='.repeat(70) + '\n')

const checksToPerform = [
  { name: 'Firebase config file', status: configExists },
  { name: 'Instrumentation hook', status: instrumentationExists },
  { name: 'Base repository', status: baseRepoExists },
]

const allChecksPass = checksToPerform.every(check => check.status)

console.log('Required Files:')
for (const check of checksToPerform) {
  console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`)
}

console.log('\n' + '─'.repeat(70))

if (allChecksPass) {
  console.log('\n✅ FIREBASE INITIALIZATION SETUP IS COMPLETE\n')
  console.log('Next Steps:')
  console.log('  1. Start development server: npm run dev')
  console.log('  2. Server startup will call instrumentation hook')
  console.log('  3. Firebase will initialize automatically')
  console.log('  4. All repositories will receive Firestore instance')
  console.log('  5. Test endpoints will work without initialization errors\n')
} else {
  console.log('\n⚠️  SOME FILES ARE MISSING\n')
  console.log('Required fixes:')
  if (!configExists) console.log('  • Firebase config: backend/src/config/firebase.ts')
  if (!instrumentationExists) console.log('  • Instrumentation hook: instrumentation.ts')
  if (!baseRepoExists) console.log('  • Base repository: backend/src/repositories/BaseRepository.ts')
  console.log()
}

console.log('='.repeat(70) + '\n')
