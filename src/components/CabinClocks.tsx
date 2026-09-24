import { useEffect, useState } from 'react'

const HOME = { label: 'IST', timeZone: 'Asia/Kolkata' }

export interface CabinClocksProps {
  /** Short label for the destination zone, e.g. SGT. */
  zoneLabel: string
  /** Used instead of `zoneLabel` while that zone is on summer time. */
  zoneLabelDst?: string
  timeZone: string
}

function offsetMinutes(timeZone: string, at: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? '')
  if (!match) {
    return 0
  }
  return (
    (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
  )
}

/** True when the zone is currently off its own standard offset. */
function onSummerTime(timeZone: string, at: Date): boolean {
  const year = at.getUTCFullYear()
  const jan = offsetMinutes(timeZone, new Date(Date.UTC(year, 0, 1)))
  const jul = offsetMinutes(timeZone, new Date(Date.UTC(year, 6, 1)))
  return offsetMinutes(timeZone, at) > Math.min(jan, jul)
}

function formatTime(timeZone: string, at: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)
}

/** Home and destination local times, the way a cabin display carries them. */
export function CabinClocks({
  zoneLabel,
  zoneLabelDst,
  timeZone,
}: CabinClocksProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const label =
    zoneLabelDst && onSummerTime(timeZone, now) ? zoneLabelDst : zoneLabel
  const zones = [HOME, { label, timeZone }]

  return (
    <div className="flex items-baseline gap-3 tabular-nums sm:gap-4">
      {zones.map((zone) => (
        <p key={zone.label} className="hud-label text-[#2a2621]/75">
          <span className="text-[#2a2621]/45">{zone.label}</span>{' '}
          {formatTime(zone.timeZone, now)}
        </p>
      ))}
    </div>
  )
}
