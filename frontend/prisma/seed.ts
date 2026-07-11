import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get or create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'spice-garden' },
    update: {},
    create: {
      name: 'Spice Garden Hotels',
      slug: 'spice-garden',
      email: 'admin@spicegarden.com',
      phone: '+91-22-1234-5678',
      country: 'India',
      industry: 'Food & Beverage',
      subscriptionTier: 'professional',
      status: 'active',
    },
  })

  console.log(`Organization: ${org.id}`)

  // Get or create Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { idx_restaurant_org_slug: { organizationId: org.id, slug: 'spice-garden-main' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Spice Garden',
      slug: 'spice-garden-main',
      email: 'spicegarden@example.com',
      phone: '+91-22-9876-5432',
      cuisineType: 'Indian',
      address: '123 MG Road, Mumbai',
      status: 'active',
      maxTables: 30,
      avgTableCapacity: 4,
    },
  })

  console.log(`Restaurant: ${restaurant.id}`)

  // Get or create Branch
  const branch = await prisma.branch.upsert({
    where: { idx_branch_restaurant_name: { restaurantId: restaurant.id, name: 'Mumbai Central' } },
    update: {},
    create: {
      restaurantId: restaurant.id,
      organizationId: org.id,
      name: 'Mumbai Central',
      address: '456 Business Park, Mumbai',
      phone: '+91-22-5555-1111',
      email: 'mumbai@spicegarden.com',
      status: 'active',
      maxTables: 30,
      isPrimary: true,
    },
  })

  console.log(`Branch: ${branch.id}`)

  // Create or verify User
  const user = await prisma.user.upsert({
    where: { email: 'owner@spicegarden.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'owner@spicegarden.com',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      role: 'restaurant_owner',
      status: 'active',
      isEmailVerified: true,
    },
  })

  console.log(`User: ${user.id}`)

  // Create Restaurant Settings
  await prisma.restaurantSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      organizationId: org.id,
      taxPercentage: 5.0,
      serviceChargePercentage: 0,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
  })

  console.log('Restaurant settings created')

  // Create Menu Categories using the unique constraint
  const categories = await Promise.all([
    prisma.menuCategory.upsert({
      where: { idx_category_restaurant_name: { restaurantId: restaurant.id, name: 'Appetizers' } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        organizationId: org.id,
        name: 'Appetizers',
        description: 'Starters and appetizers',
        displayOrder: 1,
      },
    }),
    prisma.menuCategory.upsert({
      where: { idx_category_restaurant_name: { restaurantId: restaurant.id, name: 'Main Course' } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        organizationId: org.id,
        name: 'Main Course',
        description: 'Main course dishes',
        displayOrder: 2,
      },
    }),
    prisma.menuCategory.upsert({
      where: { idx_category_restaurant_name: { restaurantId: restaurant.id, name: 'Beverages' } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        organizationId: org.id,
        name: 'Beverages',
        description: 'Drinks and beverages',
        displayOrder: 3,
      },
    }),
  ])

  console.log(`Menu categories ready: ${categories.length}`)

  // Create Menu Items
  // Clear existing to ensure fresh data
  await prisma.menuItem.deleteMany({
    where: { restaurantId: restaurant.id },
  })

  const menuItems = [
    {
      restaurantId: restaurant.id,
      organizationId: org.id,
      categoryId: categories[0].id,
      name: 'Paneer Tikka',
      description: 'Cottage cheese marinated in spiced yogurt',
      basePrice: 320,
      costPrice: 120,
      isVegetarian: true,
      isAvailable: true,
      preparationTimeMinutes: 15,
      displayOrder: 1,
    },
    {
      restaurantId: restaurant.id,
      organizationId: org.id,
      categoryId: categories[1].id,
      name: 'Butter Chicken',
      description: 'Chicken in creamy tomato sauce',
      basePrice: 420,
      costPrice: 160,
      isVegetarian: false,
      isAvailable: true,
      preparationTimeMinutes: 20,
      displayOrder: 1,
    },
    {
      restaurantId: restaurant.id,
      organizationId: org.id,
      categoryId: categories[2].id,
      name: 'Masala Chai',
      description: 'Traditional Indian spiced tea',
      basePrice: 60,
      costPrice: 15,
      isVegetarian: true,
      isAvailable: true,
      preparationTimeMinutes: 5,
      displayOrder: 1,
    },
  ]

  for (const itemData of menuItems) {
    await prisma.menuItem.create({ data: itemData as any })
  }

  const createdItems = await prisma.menuItem.findMany({
    where: { restaurantId: restaurant.id },
  })

  console.log(`Menu items created: ${createdItems.length}`)

  // Create Tables if not exist
  const tableCount = await prisma.restaurantTable.count({
    where: { branchId: branch.id },
  })

  if (tableCount === 0) {
    for (let i = 1; i <= 10; i++) {
      await prisma.restaurantTable.create({
        data: {
          branchId: branch.id,
          restaurantId: restaurant.id,
          organizationId: org.id,
          tableNumber: i.toString(),
          capacity: i <= 5 ? 2 : i <= 8 ? 4 : 6,
          section: i <= 5 ? 'Indoor' : 'Outdoor',
          status: 'available',
        },
      })
    }
    console.log('Created 10 tables')
  }

  // Print credentials
  console.log('\n========== SEED DATA CREATED ==========')
  console.log(`Organization ID: ${org.id}`)
  console.log(`Restaurant ID: ${restaurant.id}`)
  console.log(`Branch ID: ${branch.id}`)
  console.log(`User ID: ${user.id}`)
  console.log('========================================\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error:', e.message)
    await prisma.$disconnect()
    process.exit(1)
  })
