import { useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import roundelUrl from '../assets/airasia-roundel.png'
import { useHandTracking } from '../hooks/useHandTracking.ts'
import { flagDataUrl } from '../scene/flags.ts'
import {
  createPhotoScene,
  DESTINATIONS,
  SCENES,
  SWEEP_IN_MS,
  SWEEP_TOTAL_MS,
  type SceneHandle,
} from '../scene/photoScene.ts'
import { AirplaneWindow } from './AirplaneWindow.tsx'
import { CabinClocks } from './CabinClocks.tsx'
import { CabinInterior } from './CabinInterior.tsx'

const SNAP_OPEN = 0.75
const SNAP_CLOSED = 0.25
/** Below this open fraction the blind counts as shut and the scene cycles. */
const CYCLE_POINT = 0.1
/** How long the blind must sit untouched before it lifts itself again. */
const REOPEN_DELAY = 950

export function WindowView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SceneHandle | null>(null)
  const sliderRef = useRef<HTMLInputElement>(null)
  const reopenTimer = useRef(0)
  const swapTimer = useRef(0)
  const settleTimer = useRef(0)
  const lastTouchRef = useRef(0)
  const armedRef = useRef(false)
  const sweepingRef = useRef(false)

  const [sceneIndex, setSceneIndex] = useState(0)
  const [webglFailed, setWebglFailed] = useState(false)
  // Which destination is selected, and which one the view is actually showing.
  // They differ mid-sweep: the view changes under the cloud, not on click.
  const [destIndex, setDestIndex] = useState(0)
  const [shownDest, setShownDest] = useState(0)
  // On coarse pointers the first tap arms a chip; the second tap flies.
  const [coarse, setCoarse] = useState(false)
  const [armedDest, setArmedDest] = useState<number | null>(null)

  // Blind target: 0 closed, 1 open. The spring gives it weight and bounce.
  const target = useMotionValue(0)
  const open = useSpring(target, { stiffness: 120, damping: 14 })

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    const sync = () => setCoarse(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  /** Marks the blind as hand-driven right now, holding off any auto-reopen. */
  const touch = useCallback(() => {
    lastTouchRef.current = performance.now()
  }, [])

  // Waits for the user to let go, so fiddling with the blind can't strand it shut.
  const scheduleReopen = useCallback(() => {
    window.clearTimeout(reopenTimer.current)
    const attempt = () => {
      const idleFor = performance.now() - lastTouchRef.current
      if (idleFor < REOPEN_DELAY) {
        reopenTimer.current = window.setTimeout(attempt, REOPEN_DELAY - idleFor)
        return
      }
      if (open.get() < SNAP_CLOSED) {
        target.set(1)
      }
    }
    reopenTimer.current = window.setTimeout(attempt, REOPEN_DELAY)
  }, [open, target])

  const changeDestination = useCallback(
    (index: number) => {
      if (sweepingRef.current || index === destIndex) {
        return
      }
      sweepingRef.current = true
      setDestIndex(index)
      sceneRef.current?.changeDestination(index)
      // Swap the placard while the cloud is at full cover, with the photo.
      window.clearTimeout(swapTimer.current)
      swapTimer.current = window.setTimeout(() => setShownDest(index), SWEEP_IN_MS)
      window.clearTimeout(settleTimer.current)
      settleTimer.current = window.setTimeout(() => {
        sweepingRef.current = false
      }, SWEEP_TOTAL_MS)
    },
    [destIndex],
  )

  /** First tap on a touch screen selects; the second confirms and flies. */
  const tapChip = useCallback(
    (index: number) => {
      if (coarse && armedDest !== index && index !== destIndex) {
        setArmedDest(index)
        return
      }
      setArmedDest(null)
      changeDestination(index)
    },
    [coarse, armedDest, destIndex, changeDestination],
  )

  useEffect(
    () => () => {
      window.clearTimeout(swapTimer.current)
      window.clearTimeout(settleTimer.current)
    },
    [],
  )

  const hands = useHandTracking({
    getOpen: () => open.get(),
    onGrabMove: (value) => {
      touch()
      target.set(value)
    },
    onRelease: () => {
      const v = open.get()
      if (v > SNAP_OPEN) {
        target.set(1)
      } else if (v < SNAP_CLOSED) {
        target.set(0)
      }
    },
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    try {
      sceneRef.current = createPhotoScene(canvas)
    } catch {
      setWebglFailed(true)
      return
    }

    const openingTimer = window.setTimeout(() => target.set(1), 900)
    return () => {
      window.clearTimeout(openingTimer)
      window.clearTimeout(reopenTimer.current)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [target])

  // Scroll and arrow keys as no-camera fallbacks.
  useEffect(() => {
    const nudge = (delta: number) => {
      touch()
      target.set(clamp01(target.get() + delta))
    }
    const onWheel = (event: WheelEvent) => nudge(-event.deltaY * 0.0011)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        nudge(0.12)
      } else if (event.key === 'ArrowDown') {
        nudge(-0.12)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [target, touch])

  useMotionValueEvent(open, 'change', (v) => {
    if (sliderRef.current && document.activeElement !== sliderRef.current) {
      sliderRef.current.value = String(Math.round(v * 100))
    }

    if (v > 0.5) {
      armedRef.current = true
    }
    // Pulling the blind fully shut swaps in the next scene behind it,
    // then the blind lifts again once the user lets go.
    if (armedRef.current && v < CYCLE_POINT) {
      armedRef.current = false
      const next = (sceneIndex + 1) % SCENES.length
      setSceneIndex(next)
      sceneRef.current?.setPreset(next)
      scheduleReopen()
    }
  })

  const light = SCENES[sceneIndex]
  const destination = DESTINATIONS[shownDest]
  const infoDest = DESTINATIONS[armedDest ?? destIndex]

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#08090b] max-md:landscape:flex-row max-md:landscape:items-stretch">
      <CabinInterior />

      {/* HUD: in the column flow on phones, floating on top on md+. */}
      <header className="relative z-10 flex shrink-0 items-start justify-between gap-4 p-4 sm:p-5 max-md:landscape:w-auto max-md:landscape:flex-col max-md:landscape:justify-start max-md:landscape:gap-4 md:pointer-events-none md:absolute md:inset-x-0 md:top-0 md:p-7">
        <div className="flex items-center gap-2.5">
          <img
            src={roundelUrl}
            alt="AirAsia"
            className="h-6 w-6 drop-shadow-sm sm:h-7 sm:w-7"
          />
          <p className="hud-label text-[#2a2621]">
            {destination.flight} · {destination.code}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 max-md:landscape:items-start">
          <p className="hud-label text-[#2a2621]/55">Seat 22A</p>
          <CabinClocks
            zoneLabel={destination.zoneLabel}
            zoneLabelDst={destination.zoneLabelDst}
            timeZone={destination.timeZone}
          />
        </div>
      </header>

      {/* The window owns the remaining height; nothing may overlap it. */}
      <div className="relative z-0 flex min-h-0 w-full flex-1 items-center justify-center px-4">
        <AirplaneWindow
          open={open}
          canvasRef={canvasRef}
          title={destination.title}
          caption={`${destination.place} · ${light.name}`}
          webglFailed={webglFailed}
        />
      </div>

      <footer className="relative z-10 flex shrink-0 flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 max-md:landscape:w-[240px] max-md:landscape:justify-center max-md:landscape:self-stretch max-md:landscape:overflow-y-auto max-md:landscape:pl-0 max-md:landscape:pr-[max(0.75rem,env(safe-area-inset-right))] md:pointer-events-none md:absolute md:inset-x-0 md:bottom-0 md:flex-row md:items-end md:justify-between md:gap-4 md:p-7">
        <div className="hidden md:block">
          <p className="hud-label text-white/90">
            {light.name} · scene {sceneIndex + 1}/{SCENES.length}
          </p>
          <p className="hud-label mt-1 text-white/45">
            Pull the blind fully shut to change the light · scroll or ↑↓ works
            too
          </p>
        </div>

        <div className="pointer-events-auto flex w-full flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a0c10]/75 p-3 backdrop-blur-md md:w-[178px]">
          {/* Selection readout, phones only. */}
          <div className="flex items-center justify-between gap-2 md:hidden">
            <p className="flex min-w-0 items-center gap-2 text-[11px] font-medium tracking-wide text-white/85">
              <img
                src={flagDataUrl(infoDest.flag)}
                alt=""
                className="h-3 w-[18px] shrink-0 rounded-[2px] object-cover"
              />
              <span className="truncate">
                {infoDest.city} · {infoDest.code} · {infoDest.duration} from
                India
              </span>
            </p>
            <span className="hud-label shrink-0 text-white/40">
              {armedDest !== null && armedDest !== destIndex
                ? 'Tap again to fly'
                : light.name}
            </span>
          </div>

          <div className="hidden md:block">
            <span className="hud-label text-white/45">Destination</span>
          </div>

          {/* Chips: a snap-scrolling strip on phones, a grid on md+. */}
          <div className="chip-strip -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 max-md:landscape:flex-wrap max-md:landscape:overflow-x-visible md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0">
            {DESTINATIONS.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => tapChip(index)}
                aria-pressed={index === destIndex}
                className={`flex min-h-11 min-w-11 shrink-0 cursor-pointer snap-start items-center justify-center gap-1.5 rounded-lg px-3 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors md:min-h-0 md:px-2 md:py-1.5 ${
                  index === destIndex
                    ? 'bg-[#efede6] text-[#101114]'
                    : index === armedDest
                      ? 'bg-white/20 text-white ring-1 ring-inset ring-white/70'
                      : 'bg-white/10 text-white/65 hover:bg-white/20'
                }`}
              >
                <img
                  src={flagDataUrl(option.flag)}
                  alt=""
                  className="h-2.5 w-[15px] rounded-[2px] object-cover"
                />
                {option.code}
              </button>
            ))}
          </div>

          {/* Never display:none — browsers stop decoding hidden video, which
              silently starves the tracker. Collapse it with layout instead. */}
          <div
            className={`overflow-hidden transition-all ${
              hands.running ? 'h-auto opacity-100' : 'h-0 opacity-0'
            }`}
          >
            <video
              ref={hands.videoRef}
              playsInline
              muted
              autoPlay
              className="aspect-[4/3] w-full -scale-x-100 rounded-lg bg-black object-cover md:max-h-none"
            />
          </div>
          <p
            className={`text-[10px] leading-relaxed tracking-wide ${
              hands.state === 'pinched'
                ? 'text-emerald-300'
                : hands.state === 'error'
                  ? 'text-red-300'
                  : 'text-white/55'
            }`}
          >
            {hands.message}
          </p>
          <div className="flex items-center gap-2 max-md:landscape:flex-col max-md:landscape:items-stretch md:flex-col md:items-stretch">
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="hud-label text-white/45">Blind</span>
              <input
                ref={sliderRef}
                type="range"
                min={0}
                max={100}
                defaultValue={0}
                aria-label="Blind position"
                className="w-full accent-[#efede6]"
                onInput={(event) => {
                  touch()
                  target.set(Number(event.currentTarget.value) / 100)
                }}
              />
            </label>
            <button
              type="button"
              onClick={hands.toggle}
              className="min-h-11 shrink-0 cursor-pointer rounded-lg bg-[#efede6] px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#101114] transition-opacity hover:opacity-85 md:min-h-0 md:py-2"
            >
              {hands.running ? 'Stop hand control' : 'Enable hand control'}
            </button>
          </div>
        </div>
      </footer>
    </main>
  )
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
