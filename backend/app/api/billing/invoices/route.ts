/**
 * GET /api/billing/invoices?branchId=<id>&date=&status=all
 * Get invoices/bills for a branch
 * MIGRATED TO FIRESTORE: Uses BillingService
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { BillingService } from '@/src/services/BillingService'

const billingService = new BillingService()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const status = request.nextUrl.searchParams.get('status') || 'all'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch bills for branch
    let bills = await billingService.getBillsByBranch(branchId, tenantContext.organizationId)

    // Filter by status if provided
    if (status !== 'all') {
      bills = bills.filter(b => b.paymentStatus === status)
    }

    // Format response
    const formatted = bills.map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      orderId: bill.orderId,
      customerId: bill.customerId,
      items: bill.items || 0,
      amount: bill.totalAmount,
      tax: bill.taxAmount || 0,
      discount: bill.discountAmount || 0,
      total: bill.grandTotal || bill.totalAmount,
      status: bill.paymentStatus.toLowerCase(),
      createdAt: bill.createdAt?.toISOString?.() || new Date().toISOString(),
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
