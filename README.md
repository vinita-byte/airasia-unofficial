# Seat 22A · Singapore Flyer

A WebGL cabin view from a descending flight into Singapore. You sit behind an airplane window while the Singapore Flyer turns over Marina Bay.

## Run locally

```bash
npm install
npm run dev
```

The app serves at [http://127.0.0.1:43417](http://127.0.0.1:43417).

Drag on the window to lean toward the glass. The blind opens on its own after the scene is ready.

## Controls

- **Hand control (MediaPipe)** — click **Enable hand control**, allow the camera, then pinch your thumb and index finger together to grab the blind. Move your pinched hand up or down to raise or lower it.
- **Scroll wheel** — scroll down pulls the blind down, scroll up raises it.
- **Arrow keys** — the up and down arrows nudge the blind.
- **Drag** on the window to lean toward the glass.

Hand tracking runs fully in the browser with [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker); the tracker wasm and model load from CDN on first use. If the camera is blocked or unavailable, scroll and arrow keys still work.

## Build

```bash
npm run build
npm run preview
```

Needs a browser with WebGL (or WebGL2) and hardware acceleration.
