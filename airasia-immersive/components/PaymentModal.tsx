'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CreditCard, Loader2, TriangleAlert } from 'lucide-react'
import Script from 'next/script'
import { useState } from 'react'
import { formatINR } from '@/lib/data'
import {
  selectPointsEarned,
  selectTotal,
  useBookingStore,
} from '@/store/useBookingStore'

type Status = 'idle' | 'creating' | 'awaiting' | 'done' | 'error'

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayCtor {
  new (options: Record<string, unknown>): { open: () => void }
}

export default function PaymentModal() {
  const total = useBookingStore(selectTotal)
  const pointsEarned = useBookingStore(selectPointsEarned)
  const hasFlight = useBookingStore((s) => s.selectedFlight !== null)
  const reset = useBookingStore((s) => s.reset)

  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [paymentId, setPaymentId] = useState('')

  const confirm = async (payload: Partial<RazorpayResponse>) => {
    const res = await fetch('/api/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.verified) {
      setStatus('error')
      setMessage('We could not verify that payment. Nothing has been charged.')
      return
    }
    setPaymentId(data.paymentId ?? 'demo')
    setStatus('done')
    reset()
  }

  const handlePayment = async () => {
    if (!hasFlight || total <= 0) return
    setStatus('creating')
    setMessage('')

    let order: {
      id: string
      amount: number
      currency: string
      mock?: boolean
      error?: string
    }
    try {
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      })
      order = await res.json()
      if (!res.ok) throw new Error(order.error ?? 'Order creation failed')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Could not reach the payment service.')
      return
    }

    // No Razorpay keys configured: walk through a simulated confirmation so the
    // flow is still demonstrable end to end.
    if (order.mock) {
      setStatus('awaiting')
      setMessage('Demo mode — no Razorpay keys configured, simulating the gateway.')
      window.setTimeout(() => {
        void confirm({
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
        })
      }, 1400)
      return
    }

    const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay
    if (!Razorpay) {
      setStatus('error')
      setMessage('The Razorpay checkout script did not load. Check your connection.')
      return
    }

    setStatus('awaiting')
    new Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'AirAsia Unofficial',
      description: 'Flight booking confirmation',
      image: `${window.location.origin}/airasia-logo.png`,
      order_id: order.id,
      handler: (response: RazorpayResponse) => void confirm(response),
      modal: {
        ondismiss: () => {
          setStatus('idle')
          setMessage('Checkout closed before payment completed.')
        },
      },
      prefill: {
        name: 'Allstar Passenger',
        email: 'passenger@example.com',
        contact: '9999999999',
      },
      theme: { color: '#ED1C24' },
    }).open()
  }

  if (status === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"
      >
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-2 font-bold text-emerald-900">Booking confirmed</p>
        <p className="mt-1 text-xs text-emerald-700">
          Payment {paymentId} · {pointsEarned.toLocaleString('en-IN')} points on the way
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-3 text-xs font-bold text-emerald-900 underline underline-offset-2"
        >
          Start another booking
        </button>
      </motion.div>
    )
  }

  const busy = status === 'creating' || status === 'awaiting'

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <button
        onClick={handlePayment}
        disabled={busy || !hasFlight || total <= 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-aa-red py-4 font-bold text-white shadow-lg transition-all hover:bg-aa-crimson disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {status === 'creating' ? 'Creating order…' : 'Waiting for payment…'}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            {hasFlight ? `Pay ${formatINR(total)} with Razorpay` : 'Select a flight to pay'}
          </>
        )}
      </button>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-2 flex items-start gap-1.5 text-xs ${
              status === 'error' ? 'text-aa-crimson' : 'text-neutral-500'
            }`}
          >
            {status === 'error' && <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}
