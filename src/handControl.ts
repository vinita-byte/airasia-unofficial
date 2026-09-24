import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/** Hand vertical band (normalized video coords) mapped onto full blind travel. */
const HAND_TOP = 0.18
const HAND_BOTTOM = 0.82

export type HandState = 'idle' | 'loading' | 'tracking' | 'pinched' | 'error'

export interface HandControlOptions {
  video: HTMLVideoElement
  /** Receives blind closedness in [0, 1] while the user pinches. */
  onBlind: (closed: number) => void
  onState: (state: HandState, message: string) => void
}

export interface HandControl {
  start: () => Promise<void>
  stop: () => void
  readonly running: boolean
}

export function createHandControl(options: HandControlOptions): HandControl {
  const { video, onBlind, onState } = options

  let landmarker: HandLandmarker | null = null
  let stream: MediaStream | null = null
  let running = false
  let rafId = 0
  let lastVideoTime = -1

  const stop = () => {
    running = false
    cancelAnimationFrame(rafId)
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    video.srcObject = null
    onState('idle', 'Hand control off')
  }

  const start = async () => {
    if (running) {
      return
    }
    running = true
    onState('loading', 'Asking for the camera…')

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
    } catch {
      running = false
      onState('error', 'Camera blocked — using scroll instead')
      return
    }

    video.srcObject = stream
    await video.play()

    if (!landmarker) {
      onState('loading', 'Loading hand tracker…')
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
        landmarker = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        })
      } catch {
        stop()
        onState('error', 'Hand tracker failed to load — using scroll instead')
        return
      }
    }

    if (!running) {
      return
    }

    onState('tracking', 'Show a hand · pinch to grab the blind')
    lastVideoTime = -1
    loop()
  }

  const loop = () => {
    if (!running || !landmarker) {
      return
    }
    rafId = requestAnimationFrame(loop)

    if (video.readyState < 2 || video.currentTime === lastVideoTime) {
      return
    }
    lastVideoTime = video.currentTime

    let result: HandLandmarkerResult
    try {
      result = landmarker.detectForVideo(video, performance.now())
    } catch {
      return
    }

    const hand = result.landmarks[0]
    if (!hand) {
      onState('tracking', 'Show a hand · pinch to grab the blind')
      return
    }

    if (isPinching(hand)) {
      const grabY = (hand[4].y + hand[8].y) / 2
      const closed = clamp01((grabY - HAND_TOP) / (HAND_BOTTOM - HAND_TOP))
      onBlind(closed)
      onState('pinched', 'Blind grabbed · move your hand up or down')
    } else {
      onState('tracking', 'Pinch thumb and index to grab the blind')
    }
  }

  return {
    start,
    stop,
    get running() {
      return running
    },
  }
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
