/**
 * POST /api/payments/razorpay/webhook
 * Razorpay webhook for payment events
 * Verify and process payment status updates
 * NOTE: Prisma removed. Using Firebase/Firestore instead.
 * TODO: Implement with Firestore and Razorpay integration
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
    // TODO: Implement with Firestore for each event type
    switch (event.event) {
      case 'payment.authorized':
        console.log('Payment authorized:', event.payload.payment.entity)
        break

      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity)
        break

      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity)
        break

      case 'order.paid':
        console.log('Order paid:', event.payload.order.entity)
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
