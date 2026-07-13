/**
 * POST /api/payments/razorpay/webhook
 * Razorpay webhook for payment events
 * Verify and process payment status updates
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { BillRepository, PaymentRepository, OrderRepository } from '@/src/repositories'

const billRepo = new BillRepository()
const paymentRepo = new PaymentRepository()
const orderRepo = new OrderRepository()

function verifyWebhookSignature(body: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!keySecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature')
    const body = await request.text()

    if (!signature) {
      console.error('Missing Razorpay signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid Razorpay webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)

    // Handle different webhook events
    switch (event.event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(event.payload.payment.entity)
        break

      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break

      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity)
        break

      default:
        console.log(`Unhandled webhook event: ${event.event}`)
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error: any) {
    console.error('Error processing Razorpay webhook:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentAuthorized(payment: any) {
  console.log(`Payment authorized: ${payment.id}`)

  // Update payment record if exists
  const payments = await paymentRepo.findMany({
    filters: [
      { field: 'transactionId', operator: '==', value: payment.id },
    ],
  })

  for (const p of payments) {
    await paymentRepo.update(
      p.id,
      { paymentStatus: 'completed' },
      'webhook'
    )
  }
}

async function handlePaymentCaptured(payment: any) {
  console.log(`Payment captured: ${payment.id}`)

  const razorpayOrderId = payment.order_id
  const paymentAmount = payment.amount / 100 // Convert from paise to rupees

  // Find payment by reference number (Razorpay order ID)
  const existingPayments = await paymentRepo.findMany({
    filters: [
      { field: 'referenceNumber', operator: '==', value: razorpayOrderId },
    ],
  })

  if (existingPayments.length > 0) {
    const existingPayment = existingPayments[0]
    const bill = await billRepo.findById(existingPayment.billId)

    if (bill) {
      // Update payment
      await paymentRepo.update(
        existingPayment.id,
        {
          transactionId: payment.id,
          paymentStatus: 'completed',
          amount: paymentAmount.toFixed(2),
        },
        'webhook'
      )

      // Update bill
      const amountPaid = parseFloat(bill.amountPaid as any)
      const balanceDue = parseFloat(bill.balanceDue as any)
      const newAmountPaid = amountPaid + paymentAmount
      const newBalanceDue = balanceDue - paymentAmount
      const isFullyPaid = newBalanceDue <= 0

      await billRepo.updatePaymentStatus(
        bill.id,
        isFullyPaid ? 'completed' : 'pending',
        newAmountPaid.toFixed(2),
        Math.max(0, newBalanceDue).toFixed(2),
        'webhook'
      )

      // Update order if fully paid
      if (isFullyPaid && bill.orderId) {
        await orderRepo.update(
          bill.orderId,
          { paymentStatus: 'completed' },
          'webhook'
        )
      }
    }
  }
}

async function handlePaymentFailed(payment: any) {
  console.log(`Payment failed: ${payment.id}`)

  // Update payment records
  const payments = await paymentRepo.findMany({
    filters: [
      { field: 'transactionId', operator: '==', value: payment.id },
    ],
  })

  for (const p of payments) {
    await paymentRepo.update(
      p.id,
      { paymentStatus: 'failed' },
      'webhook'
    )
  }
}

async function handleOrderPaid(order: any) {
  console.log(`Order paid: ${order.id}`)

  // Find and update related bills by searching for orders with this razorpay_order_id
  // For now, we'll skip this since metadata search is complex
  // This would need additional repository methods
}
