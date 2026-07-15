/**
 * Seed Dashboard Test Data
 * 
 * Creates test data in Firestore for development/testing
 * Run with: node scripts/seed-dashboard-data.mjs
 * 
 * Creates:
 * - Test orders (today and yesterday)
 * - Test restaurant tables with various statuses
 * - Test customers (today and yesterday)
 */

import admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load Firebase credentials
const serviceAccountPath = path.join(__dirname, '../credentials/firebase-admin.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'restaurant-management-d5c73',
})

const db = admin.firestore()

// Mock auth context values (from api/middleware/auth.ts)
const organizationId = 'b8f51aa9-32c3-482d-9e26-989ba5816bc4'
const restaurantId = 'fb8e6830-45a9-4586-9370-1e2a7936952a'
const branchId = '829b1e49-87b3-4cc9-a4a9-4e719bf4440c'
const userId = '2862fbcf-b0c3-403d-8e86-5fd1c205d658'

async function seedTestData() {
  console.log('🌱 Starting dashboard test data seeding...')
  console.log(`Organization ID: ${organizationId}`)
  console.log(`Branch ID: ${branchId}`)
  console.log('---')

  try {
    // Seed test orders
    await seedOrders()
    console.log('✓ Orders seeded')

    // Seed test tables
    await seedTables()
    console.log('✓ Tables seeded')

    // Seed test customers
    await seedCustomers()
    console.log('✓ Customers seeded')

    console.log('---')
    console.log('✓ All test data seeded successfully!')
    console.log('Dashboard KPI cards should now display data.')
    console.log('')
    console.log('Next steps:')
    console.log('1. Refresh your dashboard in the browser')
    console.log('2. You should see KPI cards with data')
    console.log('3. Revenue: ₹3,067 (3 orders today)')
    console.log('4. Orders: 3 (2 yesterday)')
    console.log('5. Avg Ticket: ₹1,022')
    console.log('6. Occupancy: 33% (3 occupied, 6 available)')
    console.log('7. New Guests: 2 (1 yesterday)')
    
    await admin.app().delete()
    process.exit(0)
  } catch (error) {
    console.error('✗ Error seeding data:', error)
    await admin.app().delete()
    process.exit(1)
  }
}

/**
 * Seed test orders
 */
async function seedOrders() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const ordersRef = db.collection('orders')

  // Today's orders
  const todayOrders = [
    {
      orderNumber: 'ORD-2026-0701',
      branchId,
      organizationId,
      restaurantId,
      orderType: 'dine_in',
      status: 'completed',
      paymentStatus: 'completed',
      subtotal: '500',
      discountAmount: '0',
      discountPercentage: '0',
      taxAmount: '90',
      serviceCharge: '50',
      totalAmount: '640',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 1 * 60 * 60 * 1000)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 2 * 60 * 60 * 1000)),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
      isDeleted: false,
    },
    {
      orderNumber: 'ORD-2026-0702',
      branchId,
      organizationId,
      restaurantId,
      orderType: 'dine_in',
      status: 'completed',
      paymentStatus: 'completed',
      subtotal: '800',
      discountAmount: '100',
      discountPercentage: '12.5',
      taxAmount: '126',
      serviceCharge: '70',
      totalAmount: '896',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 3 * 60 * 60 * 1000)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 4 * 60 * 60 * 1000)),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
      isDeleted: false,
    },
    {
      orderNumber: 'ORD-2026-0703',
      branchId,
      organizationId,
      restaurantId,
      orderType: 'takeaway',
      status: 'completed',
      paymentStatus: 'completed',
      subtotal: '450',
      discountAmount: '0',
      discountPercentage: '0',
      taxAmount: '81',
      serviceCharge: '0',
      totalAmount: '531',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 5 * 60 * 60 * 1000)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 6 * 60 * 60 * 1000)),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
      isDeleted: false,
    },
  ]

  // Yesterday's orders
  const yesterdayOrders = [
    {
      orderNumber: 'ORD-2026-0601',
      branchId,
      organizationId,
      restaurantId,
      orderType: 'dine_in',
      status: 'completed',
      paymentStatus: 'completed',
      subtotal: '600',
      discountAmount: '0',
      discountPercentage: '0',
      taxAmount: '108',
      serviceCharge: '60',
      totalAmount: '768',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(yesterday.getTime() + 12 * 60 * 60 * 1000)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(yesterday.getTime() + 13 * 60 * 60 * 1000)),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
      isDeleted: false,
    },
    {
      orderNumber: 'ORD-2026-0602',
      branchId,
      organizationId,
      restaurantId,
      orderType: 'dine_in',
      status: 'completed',
      paymentStatus: 'completed',
      subtotal: '700',
      discountAmount: '50',
      discountPercentage: '7.1',
      taxAmount: '117',
      serviceCharge: '65',
      totalAmount: '832',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(yesterday.getTime() + 14 * 60 * 60 * 1000)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(yesterday.getTime() + 15 * 60 * 60 * 1000)),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
      isDeleted: false,
    },
  ]

  // Write orders
  const batch = db.batch()
  
  for (const order of [...todayOrders, ...yesterdayOrders]) {
    const docRef = ordersRef.doc()
    batch.set(docRef, {
      ...order,
      id: docRef.id,
    })
  }

  await batch.commit()
}

/**
 * Seed test restaurant tables
 */
async function seedTables() {
  const tablesRef = db.collection('restaurantTables')

  const tables = [
    // Occupied tables
    { number: 1, capacity: 2, section: 'window', status: 'occupied' },
    { number: 2, capacity: 2, section: 'window', status: 'occupied' },
    { number: 3, capacity: 4, section: 'main', status: 'occupied' },
    
    // Available tables
    { number: 4, capacity: 2, section: 'window', status: 'available' },
    { number: 5, capacity: 4, section: 'main', status: 'available' },
    { number: 6, capacity: 4, section: 'main', status: 'available' },
    { number: 7, capacity: 6, section: 'private', status: 'available' },
    
    // Reserved tables
    { number: 8, capacity: 4, section: 'main', status: 'reserved' },
    
    // Cleaning tables
    { number: 9, capacity: 2, section: 'window', status: 'cleaning' },
  ]

  const batch = db.batch()

  for (const table of tables) {
    const docRef = tablesRef.doc()
    batch.set(docRef, {
      ...table,
      id: docRef.id,
      branchId,
      organizationId,
      restaurantId,
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
      isDeleted: false,
    })
  }

  await batch.commit()
}

/**
 * Seed test customers
 */
async function seedCustomers() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const customersRef = db.collection('customers')

  // Today's customers
  const todayCustomers = [
    {
      firstName: 'Raj',
      lastName: 'Kumar',
      phone: '+91-9876543210',
      email: 'raj@example.com',
      status: 'active',
      totalOrders: 5,
      totalSpent: 3500,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 1 * 60 * 60 * 1000)),
    },
    {
      firstName: 'Priya',
      lastName: 'Singh',
      phone: '+91-9876543211',
      email: 'priya@example.com',
      status: 'active',
      totalOrders: 3,
      totalSpent: 2000,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(today.getTime() + 2 * 60 * 60 * 1000)),
    },
  ]

  // Yesterday's customers
  const yesterdayCustomers = [
    {
      firstName: 'Amit',
      lastName: 'Patel',
      phone: '+91-9876543212',
      email: 'amit@example.com',
      status: 'active',
      totalOrders: 8,
      totalSpent: 5200,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(yesterday.getTime() + 10 * 60 * 60 * 1000)),
    },
  ]

  const batch = db.batch()

  for (const customer of [...todayCustomers, ...yesterdayCustomers]) {
    const docRef = customersRef.doc()
    batch.set(docRef, {
      ...customer,
      id: docRef.id,
      restaurantId,
      organizationId,
      gender: null,
      dateOfBirth: null,
      profilePictureUrl: null,
      preferredLanguage: 'en',
      customerSource: 'walk_in',
      lastVisitAt: null,
      metadata: {},
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
      updatedBy: userId,
      deletedAt: null,
      isDeleted: false,
      isActive: true,
    })
  }

  await batch.commit()
}

// Run seeding
seedTestData()
