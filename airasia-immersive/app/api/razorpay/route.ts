import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

export async function POST(req: Request) {
  let amount: unknown
  try {
    ;({ amount } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 })
  }

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'amount must be a positive number of rupees' },
      { status: 400 },
    )
  }

  const paise = Math.round(amount * 100)
  const receipt = `airasia_${Date.now()}`

  // Without real keys the app still demonstrates the full checkout flow.
  if (!KEY_ID || !KEY_SECRET) {
    return NextResponse.json({
      id: `order_mock_${Date.now()}`,
      amount: paise,
      currency: 'INR',
      receipt,
      status: 'created',
      mock: true,
    })
  }

  try {
    const { default: Razorpay } = await import('razorpay')
    const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
    const order = await razorpay.orders.create({
      amount: paise,
      currency: 'INR',
      receipt,
    })
    return NextResponse.json({ ...order, mock: false })
  } catch (error) {
    console.error('Razorpay order creation failed', error)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 502 })
  }
}
