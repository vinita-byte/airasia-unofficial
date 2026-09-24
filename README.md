# Seat 22A · Singapore Flyer

A hand-controlled interactive airplane window. A moulded cabin sidewall — overhead bin, panel seams, recessed bezel, blurred seat back — frames a live WebGL view out of the glass. Pinch in front of your webcam to pull the blind down; shut it fully and the light outside changes. Switch destination and cloud sweeps across the glass to hide the change: Singapore, Dubai, Mount Fuji or Santorini.

Built with Vite, React, Tailwind CSS, Framer Motion, Three.js, and MediaPipe.

A fan-built concept, not affiliated with or endorsed by AirAsia or Capital A.
Flight numbers and schedules are invented for the piece; no real flight is shown.

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
- **Destination (SIN · DXB · NRT · JTR)** — swaps the view. Cloud sweeps in from the left over 400ms, the photo is exchanged at full cover, then the cloud clears off the right over 600ms while the new view settles from 1.08× back to 1×. The frame, cabin and glass reflections never move; only what is beyond the glass changes. The flight number and the destination clock follow along.
- **Shut the blind fully** to cycle the light: daylight → golden hour → blue hour. The title dissolves letter by letter into the next one, and the blind lifts again on its own.

Hand tracking runs fully in the browser with [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) (`@mediapipe/tasks-vision`, the successor to `@mediapipe/hands` + `@mediapipe/camera_utils`); the tracker wasm and model load from CDN on first use. If the camera is blocked, the slider, scroll, and keys still work.

## How it's put together

- `src/components/AirplaneWindow.tsx` — the layered stack: WebGL canvas → through-glass typography → sliding blind (with cast drop shadow and pull handle) → glass glare and inset bevels → padded surround and outer bezel. The blind's `translateY` is a Framer Motion spring (`stiffness: 120`, `damping: 14`).
- `src/scene/photoScene.ts` — the view outside: destination photos rendered through a WebGL shader, with three grade presets (exposure, tint, haze, vignette) that swap while the blind is shut, and the procedural fbm cloud that sweeps across during a destination change. Two texture slots let the next photo decode while the current one is still on screen, so the exchange under the cloud never stalls.
- `src/components/CabinInterior.tsx` — the cabin around the window: moulded panel lit from the glass outward, 60px seams, overhead bin, blurred seat back and armrest, and a warm off-screen reading light.
- `src/components/CabinClocks.tsx` — home and destination local times, picking the summer-time label for zones that keep one.
- `src/hooks/useHandTracking.ts` — webcam + MediaPipe Hand Landmarker; maps pinch height to blind position and reports release for snap behavior.
- `src/components/MorphText.tsx` — the letter-by-letter scramble/dissolve between scene titles.

## Build

```bash
npm run build
npm run preview
```

Needs a browser with WebGL and hardware acceleration.

## Also in this repo

[`airasia-immersive/`](airasia-immersive) holds **AirAsia Unofficial**, a separate
Next.js app: a fan-built concept of the AirAsia booking flow with a fare engine,
a 3D cabin seat picker, Santan meals, duty free, reward tiers, a careers board
and a Razorpay checkout that runs in demo mode. See its
[README](airasia-immersive/README.md) to run it. Not affiliated with or endorsed
by AirAsia or Capital A.
