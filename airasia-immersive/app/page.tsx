'use client'

import { Plane } from 'lucide-react'
import CabinScene from '@/components/CabinScene'
import Logo from '@/components/Logo'
import CareersPortal from '@/components/CareersPortal'
import FlightSearch from '@/components/FlightSearch'
import RewardsHub from '@/components/RewardsHub'
import TripSummary from '@/components/TripSummary'
import { BaggageAndInsurance, SantanMeals } from '@/components/Ancillaries'
import { tierFor } from '@/lib/data'
import { useBookingStore } from '@/store/useBookingStore'

const NAV = [
  { href: '#booking', label: 'Flights' },
  { href: '#seats', label: 'Seat map' },
  { href: '#meals', label: 'Santan' },
  { href: '#rewards', label: 'Rewards' },
  { href: '#careers', label: 'Careers' },
]

export default function Home() {
  const memberPoints = useBookingStore((s) => s.memberPoints)
  const tier = tierFor(memberPoints)

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <a href="#booking" aria-label="AirAsia Unofficial home">
              <Logo priority />
            </a>
            <nav className="hidden gap-5 text-sm font-semibold text-neutral-600 md:flex">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-neutral-950"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold tracking-wide text-neutral-400 uppercase">
              {tier.id} member
            </p>
            <p className="text-sm font-extrabold text-aa-red">
              {memberPoints.toLocaleString('en-IN')} points
            </p>
          </div>
        </div>
      </header>

      <section className="border-b border-neutral-200 bg-aa-asphalt">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Logo variant="white" className="h-8 sm:h-10" />
            <span className="rounded-full border border-white/25 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/70 uppercase">
              Unofficial
            </span>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs font-bold tracking-widest text-aa-red uppercase">
            <Plane className="h-4 w-4" />
            Fly with the Allstars
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black text-white sm:text-5xl">
            Book the whole trip in one scroll
          </h1>
          <p className="mt-3 max-w-xl text-sm text-neutral-400 sm:text-base">
            Search live fares, walk the cabin in 3D and pick your exact seat, load
            up on Santan, then pay — without ever leaving the page.
          </p>
        </div>
      </section>

      <section id="booking" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <FlightSearch />
      </section>

      <section id="seats" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-5">
          <h2 className="text-xl font-black sm:text-2xl">Pick-a-seat: 3D fuselage</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Drag to orbit the cabin, scroll to zoom, and click a seat to add it.
            Dark seats are already taken.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CabinScene />
          </div>
          <TripSummary />
        </div>
      </section>

      <SantanMeals />
      <BaggageAndInsurance />
      <RewardsHub />
      <CareersPortal />

      <footer className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <Logo className="h-9" />
            <span className="text-sm font-black tracking-tight text-neutral-800">
              AirAsia Unofficial
            </span>
          </div>
          <p className="mt-3 max-w-2xl">
            A fan-built concept, not affiliated with or endorsed by AirAsia or
            Capital A. Fares, schedules, seat availability and job postings are
            generated for demonstration only, and no real booking is made.
          </p>
        </div>
      </footer>
    </main>
  )
}
