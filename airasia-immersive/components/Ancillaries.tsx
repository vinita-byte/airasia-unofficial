'use client'

import { Briefcase, Check, Package, ShieldCheck, Utensils } from 'lucide-react'
import {
  ANCILLARY_BUNDLES,
  BAGGAGE_OPTIONS,
  INSURANCE_OPTIONS,
  SANTAN_MENU,
  formatINR,
} from '@/lib/data'
import { useBookingStore } from '@/store/useBookingStore'

export function BundleOffers() {
  const selectedBundle = useBookingStore((s) => s.selectedBundle)
  const setBundle = useBookingStore((s) => s.setBundle)

  return (
    <section id="bundles" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <SectionHeading
        icon={<Package className="h-5 w-5 text-aa-red" />}
        title="Bundle & save"
        subtitle="One flat add-on that packages the extras most travellers buy anyway. Pick one per booking."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ANCILLARY_BUNDLES.map((bundle) => {
          const isSelected = selectedBundle?.id === bundle.id
          return (
            <button
              key={bundle.id}
              onClick={() => setBundle(bundle)}
              aria-pressed={isSelected}
              className={`rounded-xl border p-5 text-left transition-all ${
                isSelected
                  ? 'border-aa-red bg-red-50 ring-1 ring-aa-red/20'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-lg font-black">{bundle.name}</h4>
                <span className="shrink-0 font-bold text-neutral-800">
                  {formatINR(bundle.price)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-neutral-500">{bundle.description}</p>
              <span
                className={`mt-4 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${
                  isSelected ? 'bg-aa-red text-white' : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="h-3 w-3" /> Added
                  </>
                ) : (
                  '+ Add bundle'
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function SantanMeals() {
  const selectedMeals = useBookingStore((s) => s.selectedMeals)
  const toggleMeal = useBookingStore((s) => s.toggleMeal)

  return (
    <section id="meals" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <SectionHeading
        icon={<Utensils className="h-5 w-5 text-aa-red" />}
        title="Santan in-flight meals"
        subtitle="Pre-book to save up to 20% versus buying onboard. Served hot from row 1 back."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SANTAN_MENU.map((meal) => {
          const isSelected = selectedMeals.some((m) => m.name === meal.name)
          return (
            <button
              key={meal.name}
              onClick={() => toggleMeal({ name: meal.name, price: meal.price })}
              aria-pressed={isSelected}
              className={`rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-aa-red bg-red-50 ring-1 ring-aa-red/20'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold">{meal.name}</h4>
                <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-neutral-600 uppercase">
                  {meal.tag}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-neutral-500">{meal.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-neutral-800">{formatINR(meal.price)}</span>
                <span
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${
                    isSelected ? 'bg-aa-red text-white' : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3 w-3" /> Added
                    </>
                  ) : (
                    '+ Add'
                  )}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function BaggageAndInsurance() {
  const baggage = useBookingStore((s) => s.baggage)
  const insurance = useBookingStore((s) => s.insurance)
  const setBaggage = useBookingStore((s) => s.setBaggage)
  const setInsurance = useBookingStore((s) => s.setInsurance)

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <SectionHeading
            icon={<Briefcase className="h-5 w-5 text-aa-red" />}
            title="Checked baggage"
            subtitle="Cabin bags up to 7kg are always free. Add hold weight below."
            compact
          />
          <div className="space-y-2">
            {BAGGAGE_OPTIONS.map((option) => {
              const isSelected = baggage?.id === option.id
              return (
                <button
                  key={option.id}
                  onClick={() =>
                    setBaggage({
                      id: option.id,
                      weightKg: option.weightKg,
                      price: option.price,
                    })
                  }
                  aria-pressed={isSelected}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-all ${
                    isSelected
                      ? 'border-aa-red bg-red-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="font-bold">
                    {option.label} · {option.weightKg}kg
                  </span>
                  <span className="text-sm font-bold text-neutral-700">
                    {formatINR(option.price)}
                  </span>
                </button>
              )
            })}
          </div>
          {baggage && (
            <button
              onClick={() => setBaggage(baggage)}
              className="mt-3 text-xs font-bold text-neutral-500 underline underline-offset-2"
            >
              Remove baggage
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <SectionHeading
            icon={<ShieldCheck className="h-5 w-5 text-aa-red" />}
            title="Travel protection"
            subtitle="Covers delays, cancellations and medical costs across the network."
            compact
          />
          <div className="space-y-2">
            {INSURANCE_OPTIONS.map((option) => {
              const isSelected = insurance?.id === option.id
              return (
                <button
                  key={option.id}
                  onClick={() =>
                    setInsurance({
                      id: option.id,
                      label: option.label,
                      price: option.price,
                    })
                  }
                  aria-pressed={isSelected}
                  className={`flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'border-aa-red bg-red-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span>
                    <span className="block font-bold">{option.label}</span>
                    <span className="text-xs text-neutral-500">{option.cover}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-neutral-700">
                    {formatINR(option.price)}
                  </span>
                </button>
              )
            })}
          </div>
          {insurance && (
            <button
              onClick={() => setInsurance(insurance)}
              className="mt-3 text-xs font-bold text-neutral-500 underline underline-offset-2"
            >
              Remove protection
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function SectionHeading({
  icon,
  title,
  subtitle,
  compact,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  compact?: boolean
}) {
  return (
    <div className={compact ? 'mb-4' : 'mb-5'}>
      <div className="flex items-center gap-2 font-bold text-neutral-800">
        {icon}
        <h2 className={compact ? 'text-lg' : 'text-xl'}>{title}</h2>
      </div>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
    </div>
  )
}
