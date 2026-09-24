import burjUrl from '../assets/burj-khalifa.jpg'
import fujiUrl from '../assets/mount-fuji.jpg'
import santoriniUrl from '../assets/santorini.jpg'
import flyerUrl from '../assets/singapore-flyer.jpg'

export interface Destination {
  id: string
  /** Airport code shown in the cabin HUD. */
  code: string
  flight: string
  title: string
  place: string
  timeZone: string
  /** Short zone label beside the clock, for standard time. */
  zoneLabel: string
  /** Summer-time label, for the zones that keep one. */
  zoneLabelDst?: string
  photo: string
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'sin',
    code: 'SIN',
    flight: 'AK 707',
    title: 'Singapore Flyer',
    place: 'Marina Bay',
    timeZone: 'Asia/Singapore',
    zoneLabel: 'SGT',
    photo: flyerUrl,
  },
  {
    id: 'dxb',
    code: 'DXB',
    flight: 'D7 306',
    title: 'Burj Khalifa',
    place: 'Downtown Dubai',
    timeZone: 'Asia/Dubai',
    zoneLabel: 'GST',
    photo: burjUrl,
  },
  {
    id: 'nrt',
    code: 'NRT',
    flight: 'D7 532',
    title: 'Mount Fuji',
    place: 'Chureito Pagoda',
    timeZone: 'Asia/Tokyo',
    zoneLabel: 'JST',
    photo: fujiUrl,
  },
  {
    id: 'jtr',
    code: 'JTR',
    flight: 'D7 918',
    title: 'Santorini',
    place: 'Oia caldera',
    timeZone: 'Europe/Athens',
    zoneLabel: 'EET',
    zoneLabelDst: 'EEST',
    photo: santoriniUrl,
  },
]

export interface ScenePreset {
  name: string
  /** Overall brightness multiplier. */
  exposure: number
  /** Per-channel tint applied to the photo. */
  tint: [number, number, number]
  saturation: number
  /** Atmospheric haze colour mixed into the distance. */
  haze: [number, number, number]
  hazeAmount: number
  vignette: number
}

export const SCENES: ScenePreset[] = [
  {
    name: 'Daylight',
    exposure: 1,
    tint: [1, 1, 1],
    saturation: 1.05,
    haze: [0.81, 0.89, 0.96],
    hazeAmount: 0.05,
    vignette: 0.18,
  },
  {
    name: 'Golden hour',
    exposure: 0.95,
    tint: [1.18, 0.93, 0.71],
    saturation: 1.1,
    haze: [0.96, 0.69, 0.42],
    hazeAmount: 0.2,
    vignette: 0.26,
  },
  {
    name: 'Blue hour',
    exposure: 0.58,
    tint: [0.66, 0.78, 1.08],
    saturation: 0.82,
    haze: [0.15, 0.22, 0.38],
    hazeAmount: 0.28,
    vignette: 0.36,
  },
]

/** Cloud builds to full cover over this long, and the photo swaps underneath it. */
export const SWEEP_IN_MS = 400
/** Then it clears off the right edge over this long. */
export const SWEEP_OUT_MS = 600
export const SWEEP_TOTAL_MS = SWEEP_IN_MS + SWEEP_OUT_MS
/** Fraction of the sweep at which the photo underneath is exchanged. */
const SWAP_AT = SWEEP_IN_MS / SWEEP_TOTAL_MS
/** The incoming photo lands slightly large and settles back to 1. */
const SETTLE_FROM = 1.08

/** The photos are pre-cropped around the subject, so the frame stays centred. */
const FOCAL_X = 0.5
const FOCAL_Y = 0.5
const ZOOM = 1.04

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uPhotoA;
uniform sampler2D uPhotoB;
uniform float uSlot;
uniform vec2 uCoverScale;
uniform vec2 uFocal;
uniform vec2 uDrift;
uniform float uSettle;
uniform float uExposure;
uniform vec3 uTint;
uniform float uSaturation;
uniform vec3 uHaze;
uniform float uHazeAmount;
uniform float uVignette;
uniform float uReveal;
uniform float uSweep;
uniform float uTime;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    total += noise(p) * amplitude;
    p *= 2.02;
    amplitude *= 0.5;
  }
  return total;
}

void main() {
  vec2 centered = (vUv - 0.5) * uCoverScale / uSettle + uDrift;
  vec2 uv = clamp(uFocal + centered, vec2(0.0), vec2(1.0));
  // The photos are stored top-down relative to GL's texture origin.
  vec2 texUv = vec2(uv.x, 1.0 - uv.y);
  vec3 color = uSlot < 0.5
    ? texture2D(uPhotoA, texUv).rgb
    : texture2D(uPhotoB, texUv).rgb;

  color *= uTint * uExposure;

  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, uSaturation);

  // Haze thickens toward the horizon, which sits high in this frame.
  float horizon = smoothstep(0.15, 0.85, vUv.y);
  color = mix(color, uHaze, uHazeAmount * horizon);

  float dist = length(vUv - 0.5);
  color *= 1.0 - uVignette * smoothstep(0.25, 0.78, dist);

  // Cloud sweeping left to right across the glass while the view changes.
  if (uSweep >= 0.0) {
    float billow = fbm(vUv * vec2(2.6, 3.4) + vec2(uSweep * 1.6, uTime * 0.03));
    float detail = fbm(vUv * vec2(6.5, 7.5) - vec2(uSweep * 2.2, 0.0));

    // Ragged edges: displace the sweep position by the cloud's own shape.
    float x = vUv.x + (billow - 0.5) * 0.35;
    float edge = 0.45;

    float inPhase = clamp(uSweep / ${SWAP_AT.toFixed(4)}, 0.0, 1.0);
    float outPhase = clamp((uSweep - ${SWAP_AT.toFixed(4)}) / ${(1 - SWAP_AT).toFixed(4)}, 0.0, 1.0);
    // Leading edge covers everything behind it; trailing edge then uncovers.
    float front = mix(-0.9, 2.0, inPhase);
    float back = mix(-0.9, 2.0, outPhase);
    float cover = (1.0 - smoothstep(front - edge, front, x)) * smoothstep(back, back + edge, x);

    vec3 cloud = mix(vec3(0.74, 0.78, 0.85), vec3(1.0), billow * 0.6 + detail * 0.4);
    color = mix(color, cloud, cover);
  }

  // Fade up from black while the texture decodes.
  color *= uReveal;

  gl_FragColor = vec4(color, 1.0);
}
`

interface Grade {
  exposure: number
  tint: [number, number, number]
  saturation: number
  haze: [number, number, number]
  hazeAmount: number
  vignette: number
}

export interface SceneHandle {
  setPreset: (index: number) => void
  /** Sweeps cloud across the glass and exchanges the view behind it. */
  changeDestination: (index: number) => void
  dispose: () => void
}

export function createPhotoScene(canvas: HTMLCanvasElement): SceneHandle {
  const holder = canvas.parentElement
  if (!holder) {
    throw new Error('The scene canvas needs a parent element to size against.')
  }

  const gl = canvas.getContext('webgl', {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  if (!gl) {
    throw new Error('WebGL is not available.')
  }

  const program = buildProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const positionLocation = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const uSlot = uniform('uSlot')
  const uCoverScale = uniform('uCoverScale')
  const uFocal = uniform('uFocal')
  const uDrift = uniform('uDrift')
  const uSettle = uniform('uSettle')
  const uExposure = uniform('uExposure')
  const uTint = uniform('uTint')
  const uSaturation = uniform('uSaturation')
  const uHaze = uniform('uHaze')
  const uHazeAmount = uniform('uHazeAmount')
  const uVignette = uniform('uVignette')
  const uReveal = uniform('uReveal')
  const uSweep = uniform('uSweep')
  const uTime = uniform('uTime')

  gl.uniform1i(uniform('uPhotoA'), 0)
  gl.uniform1i(uniform('uPhotoB'), 1)
  gl.uniform2f(uFocal, FOCAL_X, FOCAL_Y)
  gl.uniform1f(uSettle, 1)
  gl.uniform1f(uSweep, -1)

  /** Two slots so a new view can decode while the old one is still showing. */
  const slots = [0, 1].map((index) => {
    const texture = gl.createTexture()
    gl.activeTexture(index === 0 ? gl.TEXTURE0 : gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // Single dark pixel until a photo decodes.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      1,
      1,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      new Uint8Array([12, 22, 34]),
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    return { texture, aspect: 4 / 3, loaded: false }
  })

  let disposed = false

  const loadInto = (slotIndex: number, url: string) => {
    const slot = slots[slotIndex]
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    return image
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (disposed || !image.naturalWidth) {
          return false
        }
        slot.aspect = image.naturalWidth / image.naturalHeight
        gl.activeTexture(slotIndex === 0 ? gl.TEXTURE0 : gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, slot.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
        slot.loaded = true
        resize()
        return true
      })
  }

  /** Which slot is on screen, and which is staged behind the cloud. */
  let shownSlot = 0
  let incomingSlot = 1
  let sweepStart = 0
  let sweeping = false
  let swapped = false

  void loadInto(0, DESTINATIONS[0].photo)

  const current: Grade = cloneGrade(SCENES[0])
  const target: Grade = cloneGrade(SCENES[0])

  const setPreset = (index: number) => {
    const preset = SCENES[((index % SCENES.length) + SCENES.length) % SCENES.length]
    target.exposure = preset.exposure
    target.tint = [...preset.tint]
    target.saturation = preset.saturation
    target.haze = [...preset.haze]
    target.hazeAmount = preset.hazeAmount
    target.vignette = preset.vignette
  }

  const changeDestination = (index: number) => {
    if (sweeping) {
      return
    }
    const next = DESTINATIONS[((index % DESTINATIONS.length) + DESTINATIONS.length) % DESTINATIONS.length]
    incomingSlot = shownSlot === 0 ? 1 : 0
    sweeping = true
    swapped = false
    sweepStart = performance.now()
    void loadInto(incomingSlot, next.photo)
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio, 2)
    const width = Math.max(1, Math.round(holder.clientWidth * dpr))
    const height = Math.max(1, Math.round(holder.clientHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    gl.viewport(0, 0, width, height)
    applyFraming()
  }

  /** Cover-fit the slot currently on screen; photos differ in aspect. */
  const applyFraming = () => {
    const viewAspect = canvas.width / canvas.height
    const photoAspect = slots[shownSlot].aspect
    let scaleX = 1
    let scaleY = 1
    if (viewAspect < photoAspect) {
      scaleX = viewAspect / photoAspect
    } else {
      scaleY = photoAspect / viewAspect
    }
    gl.uniform2f(uCoverScale, scaleX / ZOOM, scaleY / ZOOM)

    // Keep the focal point inside the crop so we never sample past an edge.
    const halfX = scaleX / ZOOM / 2
    const halfY = scaleY / ZOOM / 2
    gl.uniform2f(
      uFocal,
      Math.min(Math.max(FOCAL_X, halfX), 1 - halfX),
      Math.min(Math.max(FOCAL_Y, halfY), 1 - halfY),
    )
  }

  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(holder)

  let rafId = 0
  let reveal = 0
  const started = performance.now()

  const tick = (now: number) => {
    rafId = requestAnimationFrame(tick)
    const elapsed = (now - started) / 1000

    // Ease the grade toward the active preset.
    const k = 0.045
    current.exposure += (target.exposure - current.exposure) * k
    current.saturation += (target.saturation - current.saturation) * k
    current.hazeAmount += (target.hazeAmount - current.hazeAmount) * k
    current.vignette += (target.vignette - current.vignette) * k
    for (let i = 0; i < 3; i += 1) {
      current.tint[i] += (target.tint[i] - current.tint[i]) * k
      current.haze[i] += (target.haze[i] - current.haze[i]) * k
    }

    reveal += ((slots[shownSlot].loaded ? 1 : 0) - reveal) * 0.06

    let settle = 1
    if (sweeping) {
      const p = Math.min(1, (now - sweepStart) / SWEEP_TOTAL_MS)
      // The exchange happens under full cloud cover, so it is never seen.
      if (!swapped && p >= SWAP_AT) {
        swapped = true
        shownSlot = incomingSlot
        applyFraming()
      }
      if (swapped) {
        const out = (p - SWAP_AT) / (1 - SWAP_AT)
        settle = SETTLE_FROM + (1 - SETTLE_FROM) * easeOutCubic(out)
      }
      gl.uniform1f(uSweep, p)
      if (p >= 1) {
        sweeping = false
        gl.uniform1f(uSweep, -1)
      }
    }
    gl.uniform1f(uSettle, settle)
    gl.uniform1f(uSlot, shownSlot)

    // Slow drift so the view breathes like a moving aircraft.
    gl.uniform2f(
      uDrift,
      Math.sin(elapsed * 0.09) * 0.012,
      Math.sin(elapsed * 0.13) * 0.008,
    )
    gl.uniform1f(uExposure, current.exposure)
    gl.uniform3f(uTint, current.tint[0], current.tint[1], current.tint[2])
    gl.uniform1f(uSaturation, current.saturation)
    gl.uniform3f(uHaze, current.haze[0], current.haze[1], current.haze[2])
    gl.uniform1f(uHazeAmount, current.hazeAmount)
    gl.uniform1f(uVignette, current.vignette)
    gl.uniform1f(uReveal, reveal)
    gl.uniform1f(uTime, elapsed)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  rafId = requestAnimationFrame(tick)

  return {
    setPreset,
    changeDestination,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(rafId)
      observer.disconnect()
      slots.forEach((slot) => gl.deleteTexture(slot.texture))
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}

function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - clamped, 3)
}

function cloneGrade(preset: ScenePreset): Grade {
  return {
    exposure: preset.exposure,
    tint: [...preset.tint],
    saturation: preset.saturation,
    haze: [...preset.haze],
    hazeAmount: preset.hazeAmount,
    vignette: preset.vignette,
  }
}

function buildProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const program = gl.createProgram()
  if (!program) {
    throw new Error('Could not create a WebGL program.')
  }
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'Shader link failed.')
  }
  return program
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error('Could not create a WebGL shader.')
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compile failed.')
  }
  return shader
}
