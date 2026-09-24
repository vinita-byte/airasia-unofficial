'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { JOBS, JOB_TEAMS } from '@/lib/data'

export default function CareersPortal() {
  const [team, setTeam] = useState<(typeof JOB_TEAMS)[number]>('All teams')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return JOBS.filter((job) => {
      const teamMatch = team === 'All teams' || job.team === team
      const textMatch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.summary.toLowerCase().includes(q)
      return teamMatch && textMatch
    })
  }, [team, query])

  return (
    <section id="careers" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="mb-5">
        <div className="flex items-center gap-2 font-bold text-neutral-800">
          <Briefcase className="h-5 w-5 text-aa-red" />
          <h2 className="text-xl">Join the Allstars</h2>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Open roles across Capital A — flight deck, cabin, ramp, commercial and the
          digital team behind MOVE.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, cities or skills"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-aa-red"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {JOB_TEAMS.map((t) => (
            <button
              key={t}
              onClick={() => setTeam(t)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                team === t
                  ? 'bg-aa-red text-white'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="font-bold text-neutral-700">No roles match that search</p>
          <p className="mt-1 text-sm text-neutral-500">
            Try a different team, or clear the search to see all {JOBS.length} openings.
          </p>
          <button
            onClick={() => {
              setQuery('')
              setTeam('All teams')
            }}
            className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-xs font-bold hover:bg-neutral-50"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((job) => (
              <motion.article
                key={job.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5"
              >
                <span className="text-xs font-bold tracking-wider text-aa-red uppercase">
                  {job.team}
                </span>
                <h3 className="mt-1 text-lg font-bold">{job.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin className="h-3 w-3" />
                  {job.location} · {job.type}
                </p>
                <p className="mt-3 flex-1 text-sm text-neutral-600">{job.summary}</p>
                <button className="mt-4 self-start rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-900 transition-colors hover:bg-neutral-50">
                  Apply now
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  )
}
