/**
 * Firestore Seed Script - KPI Test Data
 * 
 * This script populates Firestore with sample restaurant data
 * to test dashboard KPI metrics.
 * 
 * Usage: node backend/seed-firestore-kpi.js
 */

const admin = require('firebase-admin');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const credentialsPath = path.join(__dirname, '../credentials/firebase-admin.json');

if (!fs.existsSync(credentialsPath)) {
  console.error(`❌ Firebase credentials not found at: ${credentialsPath}`);
  console.error('Please create credentials/firebase-admin.json with your Firebase service account key');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Mock IDs (from auth context in the project)
const ORGANIZATION_ID = 'b8f51aa9-32c3-482d-9e26-989ba5816bc4';
const BRANCH_ID = '829b1e49-87b3-4cc9-a4a9-4e719bf4440c';
const USER_ID = 'user-123';

/**
 * Generate sample bills for the last 2 days
 */
async function seedBills() {
  console.log('📝 Seeding bills collection...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const bills = [
    // Today's bills
    {
      billNumber: 'BILL-2026-07-15-001',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-001',
      tableId: 'table-01',
      billType: 'dine-in',
      subtotal: '2500.00',
      discountAmount: '0.00',
      discountPercentage: '0.00',
      taxAmount: '450.00',
      serviceCharge: '250.00',
      roundingAdjustment: '0.00',
      totalAmount: '3200.00',
      amountPaid: '3200.00',
      balanceDue: '0.00',
      paymentStatus: 'completed',
      paymentMethod: 'cash',
      billStatus: 'closed',
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 8), // 8 AM
      notes: 'Lunch order',
    },
    {
      billNumber: 'BILL-2026-07-15-002',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-002',
      tableId: 'table-03',
      billType: 'dine-in',
      subtotal: '1800.00',
      discountAmount: '100.00',
      discountPercentage: '5.56',
      taxAmount: '306.00',
      serviceCharge: '180.00',
      roundingAdjustment: '0.00',
      totalAmount: '2186.00',
      amountPaid: '2186.00',
      balanceDue: '0.00',
      paymentStatus: 'completed',
      paymentMethod: 'card',
      billStatus: 'closed',
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 9 + 30 * 60000), // 9:30 AM
      notes: 'Business lunch',
    },
    {
      billNumber: 'BILL-2026-07-15-003',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-003',
      tableId: 'table-05',
      billType: 'dine-in',
      subtotal: '3500.00',
      discountAmount: '0.00',
      discountPercentage: '0.00',
      taxAmount: '630.00',
      serviceCharge: '350.00',
      roundingAdjustment: '0.00',
      totalAmount: '4480.00',
      amountPaid: '4480.00',
      balanceDue: '0.00',
      paymentStatus: 'completed',
      paymentMethod: 'card',
      billStatus: 'closed',
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 12 + 30 * 60000), // 12:30 PM
      notes: 'Group party',
    },
    {
      billNumber: 'BILL-2026-07-15-004',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-004',
      tableId: 'table-02',
      billType: 'dine-in',
      subtotal: '2200.00',
      discountAmount: '220.00',
      discountPercentage: '10.00',
      taxAmount: '356.00',
      serviceCharge: '220.00',
      roundingAdjustment: '0.00',
      totalAmount: '2756.00',
      amountPaid: '2756.00',
      balanceDue: '0.00',
      paymentStatus: 'completed',
      paymentMethod: 'cash',
      billStatus: 'closed',
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 13), // 1 PM
      notes: 'Loyalty customer - 10% discount',
    },
    {
      billNumber: 'BILL-2026-07-15-005',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-005',
      tableId: 'table-06',
      billType: 'dine-in',
      subtotal: '2800.00',
      discountAmount: '0.00',
      discountPercentage: '0.00',
      taxAmount: '504.00',
      serviceCharge: '280.00',
      roundingAdjustment: '0.00',
      totalAmount: '3584.00',
      amountPaid: '3584.00',
      balanceDue: '0.00',
      paymentStatus: 'completed',
      paymentMethod: 'card',
      billStatus: 'closed',
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 19), // 7 PM
      notes: 'Dinner order',
    },
    // Yesterday's bills
    {
      billNumber: 'BILL-2026-07-14-001',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-006',
      tableId: 'table-04',
      billType: 'dine-in',
      subtotal: '2100.00',
      discountAmount: '0.00',
      discountPercentage: '0.00',
      taxAmount: '378.00',
      serviceCharge: '210.00',
      roundingAdjustment: '0.00',
      totalAmount: '2688.00',
      amountPaid: '2688.00',
      balanceDue: '0.00',
      paymentStatus: 'completed',
      paymentMethod: 'cash',
      billStatus: 'closed',
      createdAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 12), // 12 PM
      notes: 'Yesterday lunch',
    },
    {
      billNumber: 'BILL-2026-07-14-002',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-007',
      tableId: 'table-01',
      billType: 'dine-in',
      subtotal: '1600.00',
      discountAmount: '0.00',
      discountPercentage: '0.00',
      taxAmount: '288.00',
      serviceCharge: '160.00',
      roundingAdjustment: '0.00',
      totalAmount: '2048.00',
      amountPaid: '2048.00',
      balanceDue: '0.00',
      paymentStatus: 'completed',
      paymentMethod: 'card',
      billStatus: 'closed',
      createdAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 19), // 7 PM
      notes: 'Yesterday dinner',
    },
  ];

  let successCount = 0;
  for (const bill of bills) {
    try {
      const docRef = db.collection('bills').doc();
      await docRef.set({
        id: docRef.id,
        ...bill,
        createdBy: USER_ID,
        updatedBy: USER_ID,
        updatedAt: new Date(),
        isDeleted: false,
      });
      successCount++;
    } catch (error) {
      console.error(`Error creating bill ${bill.billNumber}:`, error.message);
    }
  }
  
  console.log(`✅ Seeded ${successCount} bills`);
  return bills.length === successCount;
}

/**
 * Generate sample orders for the last 2 days
 */
async function seedOrders() {
  console.log('📝 Seeding orders collection...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const orders = [
    // Today's orders
    {
      orderNumber: 'ORD-2026-07-15-001',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-001',
      tableId: 'table-01',
      orderType: 'dine-in',
      status: 'completed',
      totalAmount: '3200.00',
      itemCount: 3,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 8),
      completedAt: new Date(today.getTime() + 1000 * 60 * 60 * 8 + 30 * 60000),
    },
    {
      orderNumber: 'ORD-2026-07-15-002',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-002',
      tableId: 'table-03',
      orderType: 'dine-in',
      status: 'completed',
      totalAmount: '2186.00',
      itemCount: 2,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 9 + 30 * 60000),
      completedAt: new Date(today.getTime() + 1000 * 60 * 60 * 10),
    },
    {
      orderNumber: 'ORD-2026-07-15-003',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-003',
      tableId: 'table-05',
      orderType: 'dine-in',
      status: 'completed',
      totalAmount: '4480.00',
      itemCount: 5,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 12 + 30 * 60000),
      completedAt: new Date(today.getTime() + 1000 * 60 * 60 * 13),
    },
    {
      orderNumber: 'ORD-2026-07-15-004',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-004',
      tableId: 'table-02',
      orderType: 'dine-in',
      status: 'completed',
      totalAmount: '2756.00',
      itemCount: 3,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 13),
      completedAt: new Date(today.getTime() + 1000 * 60 * 60 * 13 + 20 * 60000),
    },
    {
      orderNumber: 'ORD-2026-07-15-005',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-005',
      tableId: 'table-06',
      orderType: 'dine-in',
      status: 'completed',
      totalAmount: '3584.00',
      itemCount: 4,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 19),
      completedAt: new Date(today.getTime() + 1000 * 60 * 60 * 19 + 35 * 60000),
    },
    // Yesterday's orders
    {
      orderNumber: 'ORD-2026-07-14-001',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-006',
      tableId: 'table-04',
      orderType: 'dine-in',
      status: 'completed',
      totalAmount: '2688.00',
      itemCount: 3,
      createdAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 12),
      completedAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 12 + 25 * 60000),
    },
    {
      orderNumber: 'ORD-2026-07-14-002',
      branchId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      restaurantId: 'rest-123',
      customerId: 'cust-007',
      tableId: 'table-01',
      orderType: 'dine-in',
      status: 'completed',
      totalAmount: '2048.00',
      itemCount: 2,
      createdAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 19),
      completedAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 19 + 20 * 60000),
    },
  ];

  let successCount = 0;
  for (const order of orders) {
    try {
      const docRef = db.collection('orders').doc();
      await docRef.set({
        id: docRef.id,
        ...order,
        createdBy: USER_ID,
        updatedBy: USER_ID,
        updatedAt: new Date(),
        isDeleted: false,
      });
      successCount++;
    } catch (error) {
      console.error(`Error creating order ${order.orderNumber}:`, error.message);
    }
  }
  
  console.log(`✅ Seeded ${successCount} orders`);
  return orders.length === successCount;
}

/**
 * Generate sample customers for the last 2 days
 */
async function seedCustomers() {
  console.log('📝 Seeding customers collection...');
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const customers = [
    // Today's new customers
    {
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '9876543210',
      restaurantId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      totalOrders: 1,
      totalSpent: '3200.00',
      lastVisit: today,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 8),
      source: 'dine-in',
    },
    {
      name: 'Priya Singh',
      email: 'priya@example.com',
      phone: '9876543211',
      restaurantId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      totalOrders: 1,
      totalSpent: '2186.00',
      lastVisit: today,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 9 + 30 * 60000),
      source: 'dine-in',
    },
    {
      name: 'Amit Patel',
      email: 'amit@example.com',
      phone: '9876543212',
      restaurantId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      totalOrders: 1,
      totalSpent: '4480.00',
      lastVisit: today,
      createdAt: new Date(today.getTime() + 1000 * 60 * 60 * 12 + 30 * 60000),
      source: 'dine-in',
    },
    // Yesterday's customers (for comparison)
    {
      name: 'Vikram Desai',
      email: 'vikram@example.com',
      phone: '9876543213',
      restaurantId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      totalOrders: 1,
      totalSpent: '2688.00',
      lastVisit: yesterday,
      createdAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 12),
      source: 'dine-in',
    },
    {
      name: 'Neha Sharma',
      email: 'neha@example.com',
      phone: '9876543214',
      restaurantId: BRANCH_ID,
      organizationId: ORGANIZATION_ID,
      totalOrders: 1,
      totalSpent: '2048.00',
      lastVisit: yesterday,
      createdAt: new Date(yesterday.getTime() + 1000 * 60 * 60 * 19),
      source: 'dine-in',
    },
  ];

  let successCount = 0;
  for (const customer of customers) {
    try {
      const docRef = db.collection('customers').doc();
      await docRef.set({
        id: docRef.id,
        ...customer,
        createdBy: USER_ID,
        updatedBy: USER_ID,
        updatedAt: new Date(),
        isDeleted: false,
      });
      successCount++;
    } catch (error) {
      console.error(`Error creating customer ${customer.name}:`, error.message);
    }
  }
  
  console.log(`✅ Seeded ${successCount} customers`);
  return customers.length === successCount;
}

/**
 * Generate sample restaurant tables
 */
async function seedTables() {
  console.log('📝 Seeding restaurantTables collection...');
  
  const tables = [
    { tableNumber: '01', status: 'available', capacity: 2 },
    { tableNumber: '02', status: 'occupied', capacity: 4 },
    { tableNumber: '03', status: 'available', capacity: 2 },
    { tableNumber: '04', status: 'reserved', capacity: 6 },
    { tableNumber: '05', status: 'occupied', capacity: 8 },
    { tableNumber: '06', status: 'maintenance', capacity: 4 },
  ];

  let successCount = 0;
  for (const table of tables) {
    try {
      const docRef = db.collection('restaurantTables').doc(`table-${table.tableNumber}`);
      await docRef.set({
        id: `table-${table.tableNumber}`,
        branchId: BRANCH_ID,
        organizationId: ORGANIZATION_ID,
        restaurantId: 'rest-123',
        ...table,
        createdBy: USER_ID,
        updatedBy: USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });
      successCount++;
    } catch (error) {
      console.error(`Error creating table ${table.tableNumber}:`, error.message);
    }
  }
  
  console.log(`✅ Seeded ${successCount} tables`);
  return tables.length === successCount;
}

/**
 * Main seed function
 */
async function main() {
  console.log('\n🌱 Starting Firestore Seed Script...\n');
  
  try {
    const billsOk = await seedBills();
    const ordersOk = await seedOrders();
    const customersOk = await seedCustomers();
    const tablesOk = await seedTables();

    console.log('\n✨ Seed script completed!\n');
    
    if (billsOk && ordersOk && customersOk && tablesOk) {
      console.log('✅ All data seeded successfully!');
      console.log('\nYou can now view the dashboard KPI metrics:');
      console.log('- Today\'s Revenue: ₹16,208 (5 completed bills)');
      console.log('- Total Orders: 5');
      console.log('- Average Ticket: ₹3,241.60');
      console.log('- Table Occupancy: 33% (2 occupied, 1 reserved, 1 maintenance)');
      console.log('- New Guests: 3 (today)');
      process.exit(0);
    } else {
      console.log('⚠️ Some data seeding failed. Check logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Seed script error:', error.message);
    process.exit(1);
  }
}

// Run the seed script
main();
