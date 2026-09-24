import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import { useCallback, useEffect, useRef, useState } from 'react'

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/** Hand vertical band (normalized video coords) mapped onto full blind travel. */
const HAND_TOP = 0.18
const HAND_BOTTOM = 0.82

export type HandState = 'idle' | 'loading' | 'tracking' | 'pinched' | 'error'

export interface HandTrackingCallbacks {
  /** Fires while pinching; `open` is 1 with the hand high, 0 with it low. */
  onPinch: (open: number) => void
  /** Fires once when the pinch is released or the hand disappears mid-grab. */
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

    if (video.readyState < 2 || video.currentTime === lastVideoTimeRef.current) {
      return
    }
    lastVideoTimeRef.current = video.currentTime

    let result: HandLandmarkerResult
    try {
      result = landmarker.detectForVideo(video, performance.now())
    } catch {
      return
    }

    const hand = result.landmarks[0]
    const pinching = hand ? isPinching(hand) : false

    if (hand && pinching) {
      pinchingRef.current = true
      const grabY = (hand[4].y + hand[8].y) / 2
      const open = 1 - clamp01((grabY - HAND_TOP) / (HAND_BOTTOM - HAND_TOP))
      callbacksRef.current.onPinch(open)
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
    if (runningRef.current || !video) {
      return
    }
    runningRef.current = true
    setRunning(true)
    report('loading', 'Asking for the camera…')

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
    } catch {
      runningRef.current = false
      setRunning(false)
      report('error', 'Camera blocked — slider and scroll still work')
      return
    }

    video.srcObject = streamRef.current
    await video.play()

    if (!landmarkerRef.current) {
      report('loading', 'Loading hand tracker…')
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
        landmarkerRef.current = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        })
      } catch {
        stop()
        report('error', 'Hand tracker failed to load — slider and scroll still work')
        return
      }
    }

    if (!runningRef.current) {
      return
    }

    report('tracking', 'Show a hand · pinch to grab the blind')
    lastVideoTimeRef.current = -1
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

function isPinching(hand: NormalizedLandmark[]): boolean {
  const pinchGap = distance(hand[4], hand[8])
  const handScale = distance(hand[0], hand[9])
  return handScale > 0 && pinchGap / handScale < 0.32
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
