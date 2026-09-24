'use client'

import { Check, ShoppingBag } from 'lucide-react'
import { DUTY_FREE_ITEMS, formatINR } from '@/lib/data'
import { useBookingStore } from '@/store/useBookingStore'

export default function DutyFreeShop() {
  const cart = useBookingStore((s) => s.dutyFreeCart)
  const addItem = useBookingStore((s) => s.addDutyFreeItem)
  const removeItem = useBookingStore((s) => s.removeDutyFreeItem)

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-bold text-aa-red">
          <ShoppingBag className="h-5 w-5" />
          <span>Duty free · shop now, collect onboard</span>
        </div>
        <p className="text-xs font-bold text-neutral-500">
          {cart.length === 0
            ? 'Cart is empty'
            : `${cart.length} item${cart.length > 1 ? 's' : ''} · ${formatINR(cartTotal)} added to your trip`}
        </p>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Pre-order tax-free and the crew hands it to your seat before landing.
        Everything here settles in the same checkout as your fare.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DUTY_FREE_ITEMS.map((item) => {
          const inCart = cart.some((i) => i.id === item.id)
          return (
            <button
              key={item.id}
              onClick={() => (inCart ? removeItem(item.id) : addItem(item))}
              aria-pressed={inCart}
              className={`rounded-xl border p-4 text-left transition-all ${
                inCart
                  ? 'border-aa-red bg-red-50 ring-1 ring-aa-red/20'
                  : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-neutral-600 uppercase">
                {item.category}
              </span>
              <h4 className="mt-2 font-bold">{item.name}</h4>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-neutral-800">{formatINR(item.price)}</span>
                <span
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${
                    inCart ? 'bg-aa-red text-white' : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {inCart ? (
                    <>
                      <Check className="h-3 w-3" /> In cart
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
    </div>
  )
}
