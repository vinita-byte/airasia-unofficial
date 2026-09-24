import type {
  HandLandmarker,
  HandLandmarkerResult,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import { useCallback, useEffect, useRef, useState } from 'react'

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/**
 * Vertical hand travel (normalized video coords) that equals one full sweep of
 * the blind. Smaller means the blind moves further for the same hand movement.
 */
const HAND_TRAVEL = 0.55

/**
 * Pinch uses separate enter/exit thresholds. With one threshold the grab
 * chatters on and off at the boundary, and every release re-runs the snap.
 */
const PINCH_ENTER = 0.3
const PINCH_EXIT = 0.45

/** If the camera never delivers frames, say so instead of spinning silently. */
const FRAME_TIMEOUT_MS = 4000

export type HandState = 'idle' | 'loading' | 'tracking' | 'pinched' | 'error'

export interface HandTrackingCallbacks {
  /** Current blind position, so a grab continues from where the blind is. */
  getOpen: () => number
  /** Fires while pinching with the new blind position (0 shut, 1 open). */
  onGrabMove: (open: number) => void
  /** Fires once when the pinch ends or the hand leaves frame mid-grab. */
  onRelease: () => void
}

export function useHandTracking(callbacks: HandTrackingCallbacks) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<HandState>('idle')
  const [message, setMessage] = useState('Hand control off')
  const [running, setRunning] = useState(false)

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const runningRef = useRef(false)
  const pinchingRef = useRef(false)
  const lastVideoTimeRef = useRef(-1)
  const firstFrameSeenRef = useRef(false)
  const loopStartedAtRef = useRef(0)

  // Where the hand and the blind were when this grab started, so the blind
  // moves by how far the hand travels rather than jumping to its absolute height.
  const anchorHandYRef = useRef(0)
  const anchorOpenRef = useRef(0)

  const report = useCallback((next: HandState, text: string) => {
    setState(next)
    setMessage(text)
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    setRunning(false)
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (pinchingRef.current) {
      pinchingRef.current = false
      callbacksRef.current.onRelease()
    }
    report('idle', 'Hand control off')
  }, [report])

  const loop = useCallback(() => {
    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (!runningRef.current || !video || !landmarker) {
      return
    }
    rafRef.current = requestAnimationFrame(loop)

    if (video.readyState < 2) {
      if (
        !firstFrameSeenRef.current &&
        performance.now() - loopStartedAtRef.current > FRAME_TIMEOUT_MS
      ) {
        report('error', 'Camera sent no frames — check it is not in use elsewhere')
      }
      return
    }
    if (video.currentTime === lastVideoTimeRef.current) {
      return
    }
    lastVideoTimeRef.current = video.currentTime
    firstFrameSeenRef.current = true

    let result: HandLandmarkerResult
    try {
      result = landmarker.detectForVideo(video, performance.now())
    } catch (error) {
      // Swallowing this is what made failures look like "no hand detected".
      runningRef.current = false
      cancelAnimationFrame(rafRef.current)
      report(
        'error',
        `Hand tracking stopped: ${error instanceof Error ? error.message : 'detection failed'}`,
      )
      return
    }

    const hand = result.landmarks[0]
    const pinchRatio = hand ? pinchTightness(hand) : Infinity
    const threshold = pinchingRef.current ? PINCH_EXIT : PINCH_ENTER
    const pinching = pinchRatio < threshold

    if (hand && pinching) {
      const grabY = (hand[4].y + hand[8].y) / 2

      if (!pinchingRef.current) {
        pinchingRef.current = true
        anchorHandYRef.current = grabY
        anchorOpenRef.current = callbacksRef.current.getOpen()
      }

      // Hand up (smaller y) raises the blind.
      const delta = (anchorHandYRef.current - grabY) / HAND_TRAVEL
      callbacksRef.current.onGrabMove(clamp01(anchorOpenRef.current + delta))
      report('pinched', 'Blind grabbed · move your hand up or down')
      return
    }

    if (pinchingRef.current) {
      pinchingRef.current = false
      callbacksRef.current.onRelease()
    }
    report(
      'tracking',
      hand
        ? 'Pinch thumb and index to grab the blind'
        : 'Show a hand · pinch to grab the blind',
    )
  }, [report])

  const start = useCallback(async () => {
    const video = videoRef.current
    if (runningRef.current) {
      return
    }
    if (!video) {
      report('error', 'Camera preview is missing from the page')
      return
    }
    runningRef.current = true
    setRunning(true)
    report('loading', 'Asking for the camera…')

    if (!navigator.mediaDevices?.getUserMedia) {
      runningRef.current = false
      setRunning(false)
      report('error', 'This browser has no camera API (needs HTTPS or localhost)')
      return
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
    } catch (error) {
      runningRef.current = false
      setRunning(false)
      report(
        'error',
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Camera permission denied — slider and scroll still work'
          : 'No camera available — slider and scroll still work',
      )
      return
    }

    video.srcObject = streamRef.current
    try {
      // An unhandled rejection here used to strand the UI on "Asking for the camera…".
      await video.play()
    } catch (error) {
      stop()
      report(
        'error',
        `Could not start the camera preview: ${error instanceof Error ? error.message : 'play blocked'}`,
      )
      return
    }

    if (!landmarkerRef.current) {
      report('loading', 'Loading hand tracker…')
      try {
        // Pulled in on demand so the tracker never weighs down first paint.
        const vision = await import('@mediapipe/tasks-vision')
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE)
        landmarkerRef.current = await createLandmarker(vision, fileset)
      } catch (error) {
        stop()
        report(
          'error',
          `Hand tracker failed to load: ${error instanceof Error ? error.message : 'unknown error'}`,
        )
        return
      }
    }

    if (!runningRef.current) {
      return
    }

    report('tracking', 'Show a hand · pinch to grab the blind')
    lastVideoTimeRef.current = -1
    firstFrameSeenRef.current = false
    loopStartedAtRef.current = performance.now()
    loop()
  }, [loop, report, stop])

  const toggle = useCallback(() => {
    if (runningRef.current) {
      stop()
    } else {
      void start()
    }
  }, [start, stop])

  useEffect(() => stop, [stop])

  return { videoRef, state, message, running, toggle }
}

/** GPU inference fails outright on plenty of machines, so fall back to CPU. */
async function createLandmarker(
  vision: typeof import('@mediapipe/tasks-vision'),
  fileset: Awaited<ReturnType<typeof import('@mediapipe/tasks-vision').FilesetResolver.forVisionTasks>>,
): Promise<HandLandmarker> {
  const base = {
    runningMode: 'VIDEO' as const,
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  }
  try {
    return await vision.HandLandmarker.createFromOptions(fileset, {
      ...base,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    })
  } catch {
    return await vision.HandLandmarker.createFromOptions(fileset, {
      ...base,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
    })
  }
}

/** Thumb-to-index gap measured against palm size, so it works at any distance. */
function pinchTightness(hand: NormalizedLandmark[]): number {
  const pinchGap = distance(hand[4], hand[8])
  const handScale = distance(hand[0], hand[9])
  return handScale > 0 ? pinchGap / handScale : Infinity
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
