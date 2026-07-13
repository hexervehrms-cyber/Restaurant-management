/**
 * GET /api/billing/invoices?branchId=<id>&date=&status=all
 * Get invoices/bills for a branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { BillingService } from '@/services/BillingService'

const billingService = new BillingService()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const date = request.nextUrl.searchParams.get('date')
    const status = request.nextUrl.searchParams.get('status') || 'all'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Get bills by branch
    let bills = await billingService.getBillsByBranch(branchId, tenantContext.organizationId)

    // Filter by date if provided
    if (date) {
      const dateObj = new Date(date)
      const nextDate = new Date(dateObj)
      nextDate.setDate(nextDate.getDate() + 1)
      
      bills = bills.filter((bill) => {
        const billDate = new Date(bill.createdAt)
        return billDate >= dateObj && billDate < nextDate
      })
    }

    // Filter by status if provided
    if (status !== 'all') {
      bills = bills.filter((bill) => bill.paymentStatus === status)
    }

    // Limit to 100 results
    bills = bills.slice(0, 100)

    const formatted = bills.map((bill) => ({
      id: bill.id,
      orderId: bill.orderId,
      customerId: bill.customerId,
      customer: 'Customer', // Would need customer repository for this
      tableNumber: bill.tableId || 0,
      items: 0, // Would need bill items count from repository
      amount: parseFloat(bill.subtotal.toString()),
      tax: parseFloat(bill.taxAmount.toString()),
      discount: parseFloat((bill.discountAmount || 0).toString()),
      total: parseFloat(bill.totalAmount.toString()),
      date: new Date(bill.createdAt).toISOString().split('T')[0],
      status: bill.paymentStatus.toLowerCase(),
      paymentMethod: bill.paymentMethod || 'pending',
      createdAt: new Date(bill.createdAt).toISOString(),
    }))

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
        statuses: {
          paid: formatted.filter((b) => b.status === 'completed').length,
          pending: formatted.filter((b) => b.status === 'pending').length,
          overdue: 0,
        },
      },
    }))
  } catch (error: any) {
    console.error('Error fetching invoices:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'BILLING_ERROR'),
      { status: 500 }
    )
  }
}
