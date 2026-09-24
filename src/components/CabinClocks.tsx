import { useEffect, useState } from 'react'

const HOME = { label: 'IST', timeZone: 'Asia/Kolkata' }

export interface CabinClocksProps {
  /** Short label for the destination zone, e.g. SGT. */
  zoneLabel: string
  timeZone: string
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
export function CabinClocks({ zoneLabel, timeZone }: CabinClocksProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const zones = [HOME, { label: zoneLabel, timeZone }]

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
