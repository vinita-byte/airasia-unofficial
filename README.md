# Seat 22A · Singapore Flyer

A hand-controlled interactive airplane window. A layered React UI — bezel, glass, sliding blind — frames a live WebGL view of the Singapore Flyer over Marina Bay. Pinch in front of your webcam to pull the blind down; shut it fully and the scene outside changes.

Built with Vite, React, Tailwind CSS, Framer Motion, Three.js, and MediaPipe.

**Live:** [seat-22a.vercel.app](https://seat-22a.vercel.app)

Hand control needs camera permission, which browsers only grant over HTTPS — the deployed site qualifies.

## Run locally

```bash
npm install
npm run dev
```

The app serves at [http://127.0.0.1:43417](http://127.0.0.1:43417).

## Controls

- **Hand control (MediaPipe)** — click **Enable hand control**, allow the camera, then pinch your thumb and index finger together to grab the blind. Move your pinched hand up or down. Release near the top or bottom and the blind snaps fully open or shut.
- **Slider** — drives the blind directly, 0% closed to 100% open.
- **Scroll wheel / arrow keys** — nudge the blind without a camera.
- **Shut the blind fully** to cycle the scene: day over Marina Bay → golden hour → blue hour. The scene title dissolves letter by letter into the next one, and the blind lifts again on its own.

Hand tracking runs fully in the browser with [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) (`@mediapipe/tasks-vision`, the successor to `@mediapipe/hands` + `@mediapipe/camera_utils`); the tracker wasm and model load from CDN on first use. If the camera is blocked, the slider, scroll, and keys still work.

## How it's put together

- `src/components/AirplaneWindow.tsx` — the layered stack: WebGL canvas → through-glass typography → sliding blind (with cast drop shadow and pull handle) → glass glare and inset bevels → padded surround and outer bezel. The blind's `translateY` is a Framer Motion spring (`stiffness: 120`, `damping: 14`).
- `src/scene/singaporeScene.ts` — the Three.js scene (Singapore Flyer, bay water shader, city, park) with three lighting presets that swap while the blind is shut.
- `src/hooks/useHandTracking.ts` — webcam + MediaPipe Hand Landmarker; maps pinch height to blind position and reports release for snap behavior.
- `src/components/MorphText.tsx` — the letter-by-letter scramble/dissolve between scene titles.

## Build

```bash
npm run build
npm run preview
```

Needs a browser with WebGL and hardware acceleration.
