import { useMotionValue, useMotionValueEvent, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { AirplaneWindow } from './components/AirplaneWindow.tsx'
import { useHandTracking } from './hooks/useHandTracking.ts'
import {
  createSingaporeScene,
  SCENES,
  type SceneHandle,
} from './scene/singaporeScene.ts'

const SNAP_OPEN = 0.75
const SNAP_CLOSED = 0.25
/** Below this open fraction the blind counts as shut and the scene cycles. */
const CYCLE_POINT = 0.1

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SceneHandle | null>(null)
  const sliderRef = useRef<HTMLInputElement>(null)
  const reopenTimer = useRef(0)
  const armedRef = useRef(false)

  const [sceneIndex, setSceneIndex] = useState(0)
  const [webglFailed, setWebglFailed] = useState(false)

  // Blind target: 0 closed, 1 open. The spring gives it weight and bounce.
  const target = useMotionValue(0)
  const open = useSpring(target, { stiffness: 120, damping: 14 })

  const hands = useHandTracking({
    onPinch: (value) => {
      window.clearTimeout(reopenTimer.current)
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
      sceneRef.current = createSingaporeScene(canvas)
    } catch {
      setWebglFailed(true)
      return
    }

    const openingTimer = window.setTimeout(() => target.set(1), 900)
    return () => {
      window.clearTimeout(openingTimer)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [target])

  // Scroll and arrow keys as no-camera fallbacks.
  useEffect(() => {
    const nudge = (delta: number) => {
      window.clearTimeout(reopenTimer.current)
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
  }, [target])

  useMotionValueEvent(open, 'change', (v) => {
    if (sliderRef.current && document.activeElement !== sliderRef.current) {
      sliderRef.current.value = String(Math.round(v * 100))
    }

    if (v > 0.5) {
      armedRef.current = true
    }
    // Pulling the blind fully shut swaps in the next scene behind it,
    // then the blind lifts again on its own to reveal it.
    if (armedRef.current && v < CYCLE_POINT) {
      armedRef.current = false
      setSceneIndex((index) => {
        const next = (index + 1) % SCENES.length
        sceneRef.current?.setPreset(next)
        return next
      })
      window.clearTimeout(reopenTimer.current)
      reopenTimer.current = window.setTimeout(() => target.set(1), 1000)
    }
  })

  const scene = SCENES[sceneIndex]

  return (
    <main className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#08090b]">
      {/* Cabin wall. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 30%, #17181d 0%, #0b0c0f 55%, #050607 100%)',
        }}
      />

      <AirplaneWindow
        open={open}
        canvasRef={canvasRef}
        title={scene.title}
        caption={scene.caption}
        webglFailed={webglFailed}
      />

      {/* HUD */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-baseline justify-between p-5 sm:p-7">
        <p className="hud-label text-white/90">SQ 318 · SIN</p>
        <p className="hud-label text-white/45">Seat 22A</p>
      </header>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
        <div>
          <p className="hud-label text-white/90">
            Scene {sceneIndex + 1}/{SCENES.length} · {scene.title}
          </p>
          <p className="hud-label mt-1 hidden text-white/40 sm:block">
            Pull the blind fully shut to change the scene · scroll or ↑↓ works
            too
          </p>
        </div>

        <div className="pointer-events-auto flex w-[178px] flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a0c10]/75 p-3 backdrop-blur-md">
          <video
            ref={hands.videoRef}
            playsInline
            muted
            className={`aspect-[4/3] w-full -scale-x-100 rounded-lg bg-black object-cover ${
              hands.running ? 'block' : 'hidden'
            }`}
          />
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
                window.clearTimeout(reopenTimer.current)
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
