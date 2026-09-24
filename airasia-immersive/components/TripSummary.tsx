'use client'

import { Ticket } from 'lucide-react'
import { formatINR } from '@/lib/data'
import {
  POINT_VALUE,
  selectPointsDiscount,
  selectSubtotal,
  selectTotal,
  useBookingStore,
} from '@/store/useBookingStore'
import PaymentModal from './PaymentModal'

export default function TripSummary() {
  const flight = useBookingStore((s) => s.selectedFlight)
  const passengers = useBookingStore((s) => s.passengers)
  const seats = useBookingStore((s) => s.selectedSeats)
  const meals = useBookingStore((s) => s.selectedMeals)
  const baggage = useBookingStore((s) => s.baggage)
  const insurance = useBookingStore((s) => s.insurance)
  const origin = useBookingStore((s) => s.origin)
  const destination = useBookingStore((s) => s.destination)

  const subtotal = useBookingStore(selectSubtotal)
  const discount = useBookingStore(selectPointsDiscount)
  const total = useBookingStore(selectTotal)

  const seatTotal = seats.reduce((acc, s) => acc + s.price, 0)
  const mealTotal = meals.reduce((acc, m) => acc + m.price, 0)

  return (
    <aside className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 lg:sticky lg:top-24">
      <div className="mb-1 flex items-center gap-2 font-bold text-aa-red">
        <Ticket className="h-4 w-4" />
        <h3 className="text-lg text-neutral-900">Trip summary</h3>
      </div>

      {!flight ? (
        <p className="mt-3 text-sm text-neutral-500">
          Choose a flight from the fare list to start building your trip. Seats,
          meals and baggage all price up here as you add them.
        </p>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            {flight.flightNo} · {origin} → {destination} · {flight.depart}
          </p>

          <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <Line
              label={`Base fare × ${passengers}`}
              value={formatINR(flight.baseFare * passengers)}
            />
            <Line
              label={seats.length ? `Seats ${seats.map((s) => s.id).join(', ')}` : 'Seats'}
              value={seats.length ? formatINR(seatTotal) : 'None selected'}
              muted={!seats.length}
            />
            <Line
              label={meals.length ? `Santan meals × ${meals.length}` : 'Santan meals'}
              value={meals.length ? formatINR(mealTotal) : 'None selected'}
              muted={!meals.length}
            />
            <Line
              label={baggage ? `Baggage ${baggage.weightKg}kg` : 'Checked baggage'}
              value={baggage ? formatINR(baggage.price) : 'Cabin only'}
              muted={!baggage}
            />
            <Line
              label="Travel protection"
              value={insurance ? formatINR(insurance.price) : 'Not added'}
              muted={!insurance}
            />
          </dl>

          <dl className="mt-3 space-y-2 border-t border-neutral-100 pt-3 text-sm">
            <Line label="Subtotal" value={formatINR(subtotal)} />
            {discount > 0 && (
              <Line
                label={`Points burned (${Math.round(discount / POINT_VALUE).toLocaleString('en-IN')} pts)`}
                value={`−${formatINR(discount)}`}
                accent
              />
            )}
          </dl>

          <div className="mt-3 flex items-baseline justify-between border-t border-neutral-200 pt-3">
            <span className="font-bold">Total due</span>
            <span className="text-2xl font-black">{formatINR(total)}</span>
          </div>
        </>
      )}

      <div className="mt-6 border-t border-neutral-100 pt-4">
        <PaymentModal />
      </div>
    </aside>
  )
}

function Line({
  label,
  value,
  muted,
  accent,
}: {
  label: string
  value: string
  muted?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd
        className={`shrink-0 font-bold ${
          accent ? 'text-emerald-600' : muted ? 'font-normal text-neutral-400' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
