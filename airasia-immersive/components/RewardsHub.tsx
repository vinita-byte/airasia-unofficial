'use client'

import { motion } from 'framer-motion'
import { Award, Sparkles } from 'lucide-react'
import { TIERS, formatINR } from '@/lib/data'
import {
  POINT_VALUE,
  selectPointsEarned,
  selectSubtotal,
  selectTierProgress,
  useBookingStore,
} from '@/store/useBookingStore'

export default function RewardsHub() {
  const memberPoints = useBookingStore((s) => s.memberPoints)
  const pointsToRedeem = useBookingStore((s) => s.pointsToRedeem)
  const setPointsToRedeem = useBookingStore((s) => s.setPointsToRedeem)
  const subtotal = useBookingStore(selectSubtotal)
  const pointsEarned = useBookingStore(selectPointsEarned)

  const { current, next, progress } = selectTierProgress(memberPoints)
  // Never let the slider burn more points than the booking is worth.
  const maxRedeemable = Math.min(memberPoints, Math.floor(subtotal / POINT_VALUE))

  return (
    <section id="rewards" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="overflow-hidden rounded-2xl bg-aa-asphalt text-white">
        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-2 flex items-center gap-2 font-bold text-yellow-400">
              <Award className="h-5 w-5" />
              <span>AirAsia Rewards</span>
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">
              Earn up to 10x points on every journey
            </h2>
            <p className="mt-2 max-w-lg text-sm text-neutral-400">
              Redeem points for flights, hotels, Santan combos and duty-free shopping
              across the ASEAN network. Points never expire while you stay active.
            </p>

            {/* Tier ladder */}
            <div className="mt-6">
              <div className="mb-2 flex items-baseline justify-between text-xs">
                <span className="font-bold tracking-wider text-neutral-400 uppercase">
                  {current.id} tier · {memberPoints.toLocaleString('en-IN')} pts
                </span>
                {next && (
                  <span className="text-neutral-400">
                    {(next.threshold - memberPoints).toLocaleString('en-IN')} pts to {next.id}
                  </span>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-aa-red to-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIERS.map((tier) => {
                  const reached = memberPoints >= tier.threshold
                  return (
                    <div
                      key={tier.id}
                      className={`rounded-lg border p-3 text-xs transition-opacity ${
                        reached
                          ? 'border-white/25 bg-white/10'
                          : 'border-white/10 bg-white/[0.03] opacity-60'
                      }`}
                    >
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-black ${tier.accent}`}
                      >
                        {tier.id}
                      </span>
                      <p className="mt-2 font-bold">{tier.earnRate}x points</p>
                      <p className="mt-0.5 text-[11px] text-neutral-400">
                        {tier.threshold === 0
                          ? 'Join free'
                          : `${(tier.threshold / 1000).toFixed(0)}k pts`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Earn and burn calculator */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <h3>Earn &amp; burn calculator</h3>
            </div>

            {subtotal === 0 ? (
              <p className="mt-4 text-sm text-neutral-400">
                Pick a flight above and this panel will show exactly how many points
                the trip earns, and how much you can knock off by burning what you
                already have.
              </p>
            ) : (
              <>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Booking subtotal" value={formatINR(subtotal)} />
                  <Row
                    label={`Earns at ${current.earnRate}x`}
                    value={`+${pointsEarned.toLocaleString('en-IN')} pts`}
                    accent
                  />
                </dl>

                <label className="mt-5 block">
                  <span className="flex items-baseline justify-between text-xs text-neutral-400">
                    <span className="font-bold tracking-wider uppercase">Burn points</span>
                    <span>{pointsToRedeem.toLocaleString('en-IN')} pts</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={maxRedeemable}
                    step={50}
                    value={Math.min(pointsToRedeem, maxRedeemable)}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className="mt-2 w-full accent-aa-red"
                    aria-label="Points to redeem"
                  />
                  <span className="mt-1 flex justify-between text-[11px] text-neutral-500">
                    <span>0</span>
                    <span>{maxRedeemable.toLocaleString('en-IN')} max</span>
                  </span>
                </label>

                <div className="mt-4 rounded-lg bg-emerald-500/15 p-3 text-center">
                  <p className="text-xs text-emerald-300">Discount applied</p>
                  <p className="text-xl font-black text-emerald-300">
                    −{formatINR(Math.min(pointsToRedeem, maxRedeemable) * POINT_VALUE)}
                  </p>
                </div>
              </>
            )}

            <ul className="mt-5 space-y-1 text-[11px] text-neutral-400">
              {current.perks.map((perk) => (
                <li key={perk}>· {perk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-400">{label}</dt>
      <dd className={`font-bold ${accent ? 'text-yellow-400' : ''}`}>{value}</dd>
    </div>
  )
}
