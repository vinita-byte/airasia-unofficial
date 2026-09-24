import { useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import roundelUrl from './assets/airasia-roundel.png'
import { AirplaneWindow } from './components/AirplaneWindow.tsx'
import { CabinClocks } from './components/CabinClocks.tsx'
import { CabinInterior } from './components/CabinInterior.tsx'
import { useHandTracking } from './hooks/useHandTracking.ts'
import {
  createPhotoScene,
  DESTINATIONS,
  SCENES,
  SWEEP_IN_MS,
  SWEEP_TOTAL_MS,
  type SceneHandle,
} from './scene/photoScene.ts'

const SNAP_OPEN = 0.75
const SNAP_CLOSED = 0.25
/** Below this open fraction the blind counts as shut and the scene cycles. */
const CYCLE_POINT = 0.1
/** How long the blind must sit untouched before it lifts itself again. */
const REOPEN_DELAY = 950

export default function App() {
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

  // Blind target: 0 closed, 1 open. The spring gives it weight and bounce.
  const target = useMotionValue(0)
  const open = useSpring(target, { stiffness: 120, damping: 14 })

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

  return (
    <main className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#08090b]">
      <CabinInterior />

      <AirplaneWindow
        open={open}
        canvasRef={canvasRef}
        title={destination.title}
        caption={`${destination.place} · ${light.name}`}
        webglFailed={webglFailed}
      />

      {/* HUD */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-7">
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
        <div className="flex flex-col items-end gap-1.5">
          <p className="hud-label text-[#2a2621]/55">Seat 22A</p>
          <CabinClocks
            zoneLabel={destination.zoneLabel}
            zoneLabelDst={destination.zoneLabelDst}
            timeZone={destination.timeZone}
          />
        </div>
      </header>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
        <div>
          <p className="hud-label text-white/90">
            {light.name} · scene {sceneIndex + 1}/{SCENES.length}
          </p>
          <p className="hud-label mt-1 hidden text-white/45 sm:block">
            Pull the blind fully shut to change the light · scroll or ↑↓ works
            too
          </p>
        </div>

        <div className="pointer-events-auto flex w-[178px] flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a0c10]/75 p-3 backdrop-blur-md">
          <div>
            <span className="hud-label text-white/45">Destination</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {DESTINATIONS.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => changeDestination(index)}
                  aria-pressed={index === destIndex}
                  className={`cursor-pointer rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                    index === destIndex
                      ? 'bg-[#efede6] text-[#101114]'
                      : 'bg-white/10 text-white/65 hover:bg-white/20'
                  }`}
                >
                  {option.code}
                </button>
              ))}
            </div>
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
              className="aspect-[4/3] w-full -scale-x-100 rounded-lg bg-black object-cover"
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
          <label className="flex items-center gap-2">
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
            className="cursor-pointer rounded-lg bg-[#efede6] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#101114] transition-opacity hover:opacity-85"
          >
            {hands.running ? 'Stop hand control' : 'Enable hand control'}
          </button>
        </div>
      </footer>
    </main>
  )
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
