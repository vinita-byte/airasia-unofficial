'use client'

import { motion } from 'framer-motion'
import { ArrowLeftRight, Clock, Plane, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import {
  AIRPORTS,
  CABIN_CLASSES,
  buildFareMatrix,
  formatINR,
  type CabinClass,
} from '@/lib/data'
import { useShallow } from 'zustand/react/shallow'
import { useBookingStore } from '@/store/useBookingStore'

export default function FlightSearch() {
  // Object selectors must be shallow-compared, or zustand v5 re-renders forever.
  const { origin, destination, date, cabin, passengers } = useBookingStore(
    useShallow((s) => ({
      origin: s.origin,
      destination: s.destination,
      date: s.date,
      cabin: s.cabin,
      passengers: s.passengers,
    })),
  )
  const setRoute = useBookingStore((s) => s.setRoute)
  const swapRoute = useBookingStore((s) => s.swapRoute)
  const selectFlight = useBookingStore((s) => s.selectFlight)
  const selectedFlightId = useBookingStore((s) => s.selectedFlight?.id ?? null)
  const tripType = useBookingStore((s) => s.tripType)
  const setTripType = useBookingStore((s) => s.setTripType)

  const flights = useMemo(
    () => buildFareMatrix(origin, destination, date, cabin),
    [origin, destination, date, cabin],
  )
  const cheapest = flights.length
    ? Math.min(...flights.map((f) => f.baseFare))
    : 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-aa-red">
            <Plane className="h-5 w-5" />
            <span>Flight search &amp; itinerary</span>
          </div>

          <div className="flex rounded-lg border border-neutral-200 p-0.5">
            {(
              [
                { id: 'round', label: 'Round trip' },
                { id: 'one-way', label: 'One way' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                onClick={() => setTripType(option.id)}
                aria-pressed={tripType === option.id}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  tripType === option.id
                    ? 'bg-aa-red text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_1fr_auto]">
          <Field label="From">
            <select
              value={origin}
              onChange={(e) => setRoute({ origin: e.target.value })}
              className="w-full cursor-pointer bg-transparent font-bold outline-none"
            >
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
            </select>
          </Field>

          <button
            onClick={swapRoute}
            aria-label="Swap origin and destination"
            className="flex items-center justify-center rounded-lg border border-neutral-200 px-3 py-2 text-neutral-500 transition-colors hover:border-aa-red hover:text-aa-red md:self-center"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <Field label="To">
            <select
              value={destination}
              onChange={(e) => setRoute({ destination: e.target.value })}
              className="w-full cursor-pointer bg-transparent font-bold outline-none"
            >
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Departure">
            <input
              type="date"
              value={date}
              onChange={(e) => setRoute({ date: e.target.value })}
              className="w-full bg-transparent font-bold outline-none"
            />
          </Field>

          <Field label="Guests">
            <select
              value={passengers}
              onChange={(e) => setRoute({ passengers: Number(e.target.value) })}
              className="w-full cursor-pointer bg-transparent font-bold outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CABIN_CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setRoute({ cabin: c.id as CabinClass })}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                cabin === c.id
                  ? 'border-aa-red bg-red-50 text-aa-crimson'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <span className="block font-bold">{c.label}</span>
              <span className="text-[11px] opacity-70">{c.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fare matrix */}
      {flights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-bold text-neutral-700">Pick two different airports</p>
          <p className="mt-1 text-sm text-neutral-500">
            Origin and destination are currently the same, so there is nothing to price.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <p className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
              {flights.length} flights · {origin} → {destination}
            </p>
            <p className="text-xs font-bold text-emerald-600">
              Lowest {formatINR(cheapest)}
            </p>
          </div>

          <ul className="divide-y divide-neutral-100">
            {flights.map((flight) => {
              const isSelected = flight.id === selectedFlightId
              return (
                <li key={flight.id}>
                  <motion.button
                    whileTap={{ scale: 0.995 }}
                    onClick={() => selectFlight(isSelected ? null : flight)}
                    className={`flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition-colors ${
                      isSelected ? 'bg-red-50' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="min-w-[104px]">
                      <p className="text-lg font-black tabular-nums">{flight.depart}</p>
                      <p className="text-xs text-neutral-500">{flight.flightNo}</p>
                    </div>

                    <div className="min-w-[120px] flex-1">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Clock className="h-3 w-3" />
                        {formatDuration(flight.durationMins)}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-px flex-1 bg-neutral-200" />
                        <Plane className="h-3 w-3 shrink-0 text-neutral-400" />
                        <span className="h-px flex-1 bg-neutral-200" />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{flight.aircraft}</p>
                    </div>

                    <div className="min-w-[80px]">
                      <p className="text-lg font-black tabular-nums">{flight.arrive}</p>
                      <p className="text-xs text-neutral-500">
                        {flight.onTimeRate}% on time
                      </p>
                    </div>

                    <div className="ml-auto text-right">
                      <p
                        className={`text-lg font-black ${
                          flight.baseFare === cheapest ? 'text-emerald-600' : 'text-neutral-900'
                        }`}
                      >
                        {formatINR(flight.baseFare)}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        per guest{tripType === 'round' ? ' / leg' : ''}
                      </p>
                      {flight.seatsLeft <= 8 && (
                        <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-bold text-aa-red">
                          <TrendingUp className="h-3 w-3" />
                          {flight.seatsLeft} left
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        isSelected
                          ? 'bg-aa-red text-white'
                          : 'border border-neutral-300 text-neutral-700'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </motion.button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-lg border border-neutral-200 p-3 focus-within:border-aa-red">
      <span className="block text-xs font-bold text-neutral-400 uppercase">{label}</span>
      {children}
    </label>
  )
}

function formatDuration(mins: number): string {
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
}
