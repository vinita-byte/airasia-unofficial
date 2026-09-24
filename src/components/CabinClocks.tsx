import { useEffect, useState } from 'react'

const ZONES = [
  { label: 'IST', timeZone: 'Asia/Kolkata' },
  { label: 'SGT', timeZone: 'Asia/Singapore' },
]

function formatTime(timeZone: string, at: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)
}

/** Departure and arrival local times, the way a cabin display carries them. */
export function CabinClocks() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex items-baseline gap-3 tabular-nums sm:gap-4">
      {ZONES.map((zone) => (
        <p key={zone.label} className="hud-label text-white/60">
          <span className="text-white/35">{zone.label}</span>{' '}
          {formatTime(zone.timeZone, now)}
        </p>
      ))}
    </div>
  )
}
