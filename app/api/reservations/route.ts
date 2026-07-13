/**
 * GET /api/reservations?branchId=<id>&date=today&status=all
 * Get reservations for a branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { ReservationService } from '@/backend/src/services/ReservationService'

const reservationService = new ReservationService()

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const branchId = request.nextUrl.searchParams.get('branchId')
    const date = request.nextUrl.searchParams.get('date')
    const status = request.nextUrl.searchParams.get('status') || 'all'

    // Validate input
    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    // TODO: Extract real auth context from JWT token
    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Fetch reservations with filtering
    let reservations = await reservationService.getReservationsByBranch(
      branchId,
      tenantContext.organizationId,
      status !== 'all' ? (status as any) : undefined
    )

    // Filter by date if provided
    if (date === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      reservations = reservations.filter(
        (r) =>
          new Date(r.reservationDate).getTime() >= today.getTime() &&
          new Date(r.reservationDate).getTime() < tomorrow.getTime()
      )
    }

    // Sort by reservation time
    reservations.sort((a, b) => {
      const timeA = new Date(a.reservationTime).getTime()
      const timeB = new Date(b.reservationTime).getTime()
      return timeA - timeB
    })

    // Limit to 100 results
    reservations = reservations.slice(0, 100)

    // Format response
    const formattedReservations = reservations.map((r) => ({
      id: r.id,
      customerName: r.guestName,
      customerPhone: r.guestPhone,
      customerEmail: r.guestEmail || '',
      tableId: r.tableId,
      tableNumber: r.tableId ? parseInt(r.tableId) : 0,
      date: new Date(r.reservationDate).toISOString().split('T')[0],
      time: new Date(r.reservationTime).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      reservationTime: r.reservationTime,
      guestCount: r.numberOfGuests,
      status: r.status,
      notes: r.notes || '',
      prepayment: typeof r.advancePaymentAmount === 'number'
        ? r.advancePaymentAmount
        : typeof r.advancePaymentAmount === 'string'
        ? parseFloat(r.advancePaymentAmount)
        : 0,
      createdAt: r.createdAt,
    }))

    return NextResponse.json(successResponse(formattedReservations, 'Success', {
      total: formattedReservations.length,
      statuses: {
        confirmed: formattedReservations.filter((r) => r.status === 'confirmed').length,
        pending: formattedReservations.filter((r) => r.status === 'pending').length,
        seated: formattedReservations.filter((r) => r.status === 'checked_in').length,
        cancelled: formattedReservations.filter((r) => r.status === 'cancelled').length,
      },
    }))
  } catch (error: any) {
    console.error('Error fetching reservations:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'RESERVATIONS_ERROR'),
      { status: 500 }
    )
  }
}

/**
 * POST /api/reservations
 * Create a new reservation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const {
      guestName,
      guestPhone,
      guestEmail,
      branchId,
      tableId,
      reservationDate,
      reservationTime,
      numberOfGuests,
      notes,
    } = body

    if (
      !guestName ||
      !guestPhone ||
      !branchId ||
      !tableId ||
      !reservationDate ||
      !reservationTime ||
      !numberOfGuests
    ) {
      throw new ValidationError(
        'Missing required fields: guestName, guestPhone, branchId, tableId, reservationDate, reservationTime, numberOfGuests'
      )
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    // Create reservation
    const result = await reservationService.createReservation(
      {
        guestName,
        guestPhone,
        guestEmail: guestEmail || null,
        numberOfGuests,
        reservationDate: new Date(reservationDate),
        reservationTime: new Date(reservationTime),
        durationMinutes: 120,
        status: 'pending',
        tableId: tableId as any,
        customerId: null,
        advancePaymentAmount: 0,
        advancePaymentStatus: null,
        cancellationReason: null,
        noShowReason: null,
        notes: notes || null,
        source: null,
        externalReferenceId: null,
        metadata: {},
      },
      authContext.userId || 'system',
      tenantContext.organizationId
    )

    if (!result.success) {
      return NextResponse.json(
        errorResponse(result.error || 'Failed to create reservation', 'RESERVATIONS_ERROR'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      successResponse(
        {
          id: result.data?.id,
          guestName: result.data?.guestName,
          guestPhone: result.data?.guestPhone,
          tableId: result.data?.tableId,
          reservationDate: result.data?.reservationDate,
          reservationTime: result.data?.reservationTime,
          numberOfGuests: result.data?.numberOfGuests,
          status: result.data?.status,
        },
        'Reservation created successfully'
      ),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating reservation:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'RESERVATIONS_ERROR'),
      { status: 500 }
    )
  }
}
