/**
 * POST /api/bills
 * Create a bill from an order
 * 
 * Request body:
 * {
 *   orderId: string,
 *   discount?: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { BillingService } from '@/services/BillingService'

const billingService = new BillingService()

async function generateBillNumber(
  branchId: string,
  organizationId: string
): Promise<string> {
  const today = new Date()
  const date = today.toISOString().split('T')[0].replace(/-/g, '')

  const bills = await billingService.getBillsByBranch(branchId, organizationId)
  const todayBills = bills.filter((bill) => {
    const billDate = new Date(bill.createdAt)
    return billDate.toDateString() === today.toDateString()
  })

  return `BILL-${date}-${String(todayBills.length + 1).padStart(4, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, discount } = body

    if (!orderId) {
      throw new ValidationError('orderId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch the order - would need actual order service implementation
    // For now, assuming order data comes with the request or is fetched separately
    // In a real implementation, this would call an order service
    const order: any = {
      id: orderId,
      branchId: '', // These would need to be provided or fetched
      restaurantId: '',
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      serviceCharge: 0,
      items: [],
      orderType: 'dine_in',
    }

    // For now, if we can't find order data, throw error
    if (!order.id) {
      throw new ValidationError('Order not found')
    }

    // Generate bill number
    const billNumber = await generateBillNumber(
      order.branchId,
      tenantContext.organizationId
    )

    // Create bill with items from order
    const billData = {
      organizationId: tenantContext.organizationId,
      branchId: order.branchId,
      restaurantId: order.restaurantId,
      billNumber,
      billType: order.orderType || 'dine_in',
      orderId: order.id,
      customerId: order.customerId || null,
      tableId: order.tableId || null,
      subtotal: parseFloat(order.subtotal?.toString() || '0'),
      discountAmount: discount ? discount : parseFloat((order.discountAmount || 0)?.toString() || '0'),
      taxAmount: parseFloat(order.taxAmount?.toString() || '0'),
      serviceCharge: parseFloat((order.serviceCharge || 0)?.toString() || '0'),
      amountPaid: 0,
      paymentStatus: 'pending',
      billStatus: 'open',
    }

    const billItems = (order.items || []).map((item: any) => ({
      menuItemId: item.menuItemId,
      organizationId: tenantContext.organizationId,
      itemName: item.itemName,
      basePrice: parseFloat(item.basePrice?.toString() || '0'),
      quantity: item.quantity,
      itemTotal: parseFloat(item.itemTotal?.toString() || '0'),
      taxAmount: parseFloat(item.itemTotal?.toString() || '0') * 0.05, // 5% GST
      lineTotal: parseFloat(item.itemTotal?.toString() || '0') * 1.05,
    }))

    const bill = await billingService.createBill(billData, billItems, authContext.userId)

    return NextResponse.json(
      successResponse({
        id: bill.id,
        billNumber: bill.billNumber,
        totalAmount: parseFloat(bill.totalAmount.toString()),
        balanceDue: parseFloat(bill.balanceDue.toString()),
        paymentStatus: bill.paymentStatus,
        itemCount: billItems.length,
      }),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating bill:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message || 'Failed to create bill', 'BILL_CREATE_ERROR'),
      { status: 500 }
    )
  }
}
