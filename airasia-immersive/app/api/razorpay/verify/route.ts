import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

/**
 * Confirms a payment really came from Razorpay by recomputing the HMAC over
 * `order_id|payment_id`. Never trust the client-side handler on its own.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ verified: false, error: 'Malformed body' }, { status: 400 })
  }

  const orderId = String(body.razorpay_order_id ?? '')
  const paymentId = String(body.razorpay_payment_id ?? '')
  const signature = String(body.razorpay_signature ?? '')

  if (!orderId || !paymentId) {
    return NextResponse.json(
      { verified: false, error: 'Missing order or payment id' },
      { status: 400 },
    )
  }

  if (!KEY_SECRET) {
    // Mock mode: there is no real signature to check against.
    return NextResponse.json({ verified: true, mock: true, paymentId })
  }

  const expected = createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  const verified = a.length === b.length && timingSafeEqual(a, b)

  return NextResponse.json(
    { verified, mock: false, paymentId: verified ? paymentId : null },
    { status: verified ? 200 : 400 },
  )
}
