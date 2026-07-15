/**
 * POS Orders Service
 * Handles creation of orders from POS Terminal with real calculations
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 */

export interface CreatePOSOrderItem {
  menuItemId: string
  variantId?: string
  quantity: number
  modifiers?: Array<{
    modifierId: string
    modifierName: string
    price: number
  }>
  specialInstructions?: string
}

export interface CreatePOSOrderRequest {
  branchId: string
  organizationId: string
  restaurantId: string
  userId: string
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  tableId?: string
  customerId?: string
  items: CreatePOSOrderItem[]
  discount?: number
  notes?: string
}

export interface OrderCalculations {
  subtotal: number
  discount: number
  taxableAmount: number
  taxAmount: number
  serviceCharge: number
  totalAmount: number
}

/**
 * Generate unique order number
 * TODO: Implement with Firestore
 */
export async function generateOrderNumber(
  branchId: string,
  organizationId: string
): Promise<string> {
  const today = new Date()
  const date = today.toISOString().split('T')[0].replace(/-/g, '')
  return `ORD-${date}-0001`
}

/**
 * Calculate order totals server-side
 * TODO: Implement with Firestore menu items
 */
export async function calculateOrderTotals(
  items: CreatePOSOrderItem[],
  discount: number = 0
): Promise<OrderCalculations> {
  let subtotal = 0

  // Mock calculation
  subtotal += items.length * 100

  const discountAmount = Math.min(discount, subtotal)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = Math.round((taxableAmount * 5) / 100 * 100) / 100
  const serviceCharge = 0
  const totalAmount = taxableAmount + taxAmount + serviceCharge

  return {
    subtotal,
    discount: discountAmount,
    taxableAmount,
    taxAmount,
    serviceCharge,
    totalAmount,
  }
}

/**
 * Create order from POS with all validations and calculations
 * TODO: Implement with Firestore
 */
export async function createPOSOrder(
  request: CreatePOSOrderRequest
) {
  // Stub implementation
  if (!request.items || request.items.length === 0) {
    throw new Error('Order must contain at least one item')
  }

  const calculations = await calculateOrderTotals(
    request.items,
    request.discount || 0
  )

  const orderNumber = await generateOrderNumber(request.branchId, request.organizationId)

  return {
    id: 'stub-id',
    orderNumber,
    status: 'confirmed',
    totalAmount: calculations.totalAmount,
    items: [],
  }
}
