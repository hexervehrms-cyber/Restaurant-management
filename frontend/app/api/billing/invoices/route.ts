/**
 * GET /api/billing/invoices?branchId=<id>&date=&status=all
 * Get invoices/bills for a branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

const prisma = new PrismaClient()

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

    const where: any = {
      branchId,
      restaurantId: tenantContext.restaurantId,
      organizationId: tenantContext.organizationId,
    }

    if (date) {
      const dateObj = new Date(date)
      const nextDate = new Date(dateObj)
      nextDate.setDate(nextDate.getDate() + 1)
      
      where.createdAt = {
        gte: dateObj,
        lt: nextDate,
      }
    }

    if (status !== 'all') {
      where.paymentStatus = status
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        order: {
          include: {
            diningTable: true,
          },
        },
        items: true,
        payments: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const formatted = bills.map((bill) => ({
      id: bill.id,
      orderId: bill.orderId,
      customerId: bill.customerId,
      customer: bill.customer?.name || 'Walk-in',
      tableNumber: bill.order?.diningTable?.number || 0,
      items: bill.items?.length || 0,
      amount: bill.totalAmount,
      tax: bill.totalTax,
      discount: bill.discount || 0,
      total: bill.grandTotal,
      date: bill.createdAt.toISOString().split('T')[0],
      status: bill.paymentStatus.toLowerCase(),
      paymentMethod: bill.paymentMethod || 'pending',
      createdAt: bill.createdAt.toISOString(),
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
