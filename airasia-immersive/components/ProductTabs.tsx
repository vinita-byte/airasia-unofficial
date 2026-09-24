'use client'

import { BedDouble, CarTaxiFront, Hotel } from 'lucide-react'
import { AIRPORTS, formatINR, SNAP_HOTEL_PRICE } from '@/lib/data'
import { type ProductTab, useBookingStore } from '@/store/useBookingStore'
import DutyFreeShop from './DutyFreeShop'
import FlightSearch from './FlightSearch'

const TABS: { id: ProductTab; label: string; hint: string }[] = [
  { id: 'flights', label: 'Flights', hint: 'Fares & seats' },
  { id: 'snap', label: 'SNAP', hint: 'Flight + hotel' },
  { id: 'hotels', label: 'Hotels', hint: 'Stays only' },
  { id: 'dutyfree', label: 'Duty Free', hint: 'Shop onboard' },
  { id: 'transfers', label: 'Transfers', hint: 'Airport rides' },
]

export default function ProductTabs() {
  const activeTab = useBookingStore((s) => s.activeTab)
  const setActiveTab = useBookingStore((s) => s.setActiveTab)
  const destination = useBookingStore((s) => s.destination)
  const destinationCity = AIRPORTS.find((a) => a.code === destination)?.city ?? destination

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Products"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[104px] flex-1 rounded-xl px-3 py-2.5 text-left transition-all ${
                isActive
                  ? 'bg-aa-red text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <span className="block text-sm font-black">{tab.label}</span>
              <span className={`block text-[11px] ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>
                {tab.hint}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'snap' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-aa-red/30 bg-red-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <BedDouble className="h-6 w-6 shrink-0 text-aa-red" />
            <div>
              <p className="font-bold text-aa-crimson">SNAP: hotel bundled with this booking</p>
              <p className="text-sm text-neutral-600">
                3 nights at a partner hotel in {destinationCity}, breakfast included.
              </p>
            </div>
          </div>
          <p className="text-sm font-black text-aa-crimson">
            +{formatINR(SNAP_HOTEL_PRICE)} at checkout
          </p>
        </div>
      )}

      {(activeTab === 'flights' || activeTab === 'snap') && <FlightSearch />}

      {activeTab === 'dutyfree' && <DutyFreeShop />}

      {activeTab === 'hotels' && (
        <ComingSoonPanel
          icon={<Hotel className="h-7 w-7 text-aa-red" />}
          title="Standalone stays are almost here"
          body="Hotel-only search lands in the next drop of this demo. Until then, SNAP bundles a 3-night stay straight into your flight checkout — usually the cheaper way to book both."
          ctaLabel="Bundle a hotel with SNAP"
          onCta={() => setActiveTab('snap')}
        />
      )}

      {activeTab === 'transfers' && (
        <ComingSoonPanel
          icon={<CarTaxiFront className="h-7 w-7 text-aa-red" />}
          title="Airport rides are on the way"
          body="Fixed-fare taxis and shuttles from the kerb to your hotel are coming to this demo. Your flight, seats and duty free all still check out together right now."
          ctaLabel="Back to flights"
          onCta={() => setActiveTab('flights')}
        />
      )}
    </div>
  )
}

function ComingSoonPanel({
  icon,
  title,
  body,
  ctaLabel,
  onCta,
}: {
  icon: React.ReactNode
  title: string
  body: string
  ctaLabel: string
  onCta: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        {icon}
      </div>
      <p className="mt-4 text-lg font-black">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-500">{body}</p>
      <button
        onClick={onCta}
        className="mt-5 rounded-lg bg-aa-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aa-crimson"
      >
        {ctaLabel}
      </button>
    </div>
  )
}
