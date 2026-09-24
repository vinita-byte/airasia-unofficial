import photoUrl from '../assets/singapore-flyer.jpg'

export interface ScenePreset {
  title: string
  caption: string
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
    title: 'Singapore Flyer',
    caption: 'Marina Bay · 16:40 SGT',
    exposure: 1,
    tint: [1, 1, 1],
    saturation: 1.05,
    haze: [0.81, 0.89, 0.96],
    hazeAmount: 0.05,
    vignette: 0.18,
  },
  {
    title: 'Golden Hour',
    caption: 'Final approach · 19:08 SGT',
    exposure: 0.95,
    tint: [1.18, 0.93, 0.71],
    saturation: 1.1,
    haze: [0.96, 0.69, 0.42],
    hazeAmount: 0.2,
    vignette: 0.26,
  },
  {
    title: 'Blue Hour',
    caption: 'City lights · 20:41 SGT',
    exposure: 0.58,
    tint: [0.66, 0.78, 1.08],
    saturation: 0.82,
    haze: [0.15, 0.22, 0.38],
    hazeAmount: 0.28,
    vignette: 0.36,
  },
]

/** The photo is pre-cropped around the Flyer, so the frame stays centred. */
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

uniform sampler2D uPhoto;
uniform vec2 uCoverScale;
uniform vec2 uFocal;
uniform vec2 uDrift;
uniform float uExposure;
uniform vec3 uTint;
uniform float uSaturation;
uniform vec3 uHaze;
uniform float uHazeAmount;
uniform float uVignette;
uniform float uReveal;

varying vec2 vUv;

void main() {
  vec2 centered = (vUv - 0.5) * uCoverScale + uDrift;
  vec2 uv = clamp(uFocal + centered, vec2(0.0), vec2(1.0));
  // The photo is stored top-down relative to GL's texture origin.
  vec3 color = texture2D(uPhoto, vec2(uv.x, 1.0 - uv.y)).rgb;

  color *= uTint * uExposure;

  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, uSaturation);

  // Haze thickens toward the horizon, which sits high in this frame.
  float horizon = smoothstep(0.15, 0.85, vUv.y);
  color = mix(color, uHaze, uHazeAmount * horizon);

  float dist = length(vUv - 0.5);
  color *= 1.0 - uVignette * smoothstep(0.25, 0.78, dist);

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
  const uCoverScale = uniform('uCoverScale')
  const uFocal = uniform('uFocal')
  const uDrift = uniform('uDrift')
  const uExposure = uniform('uExposure')
  const uTint = uniform('uTint')
  const uSaturation = uniform('uSaturation')
  const uHaze = uniform('uHaze')
  const uHazeAmount = uniform('uHazeAmount')
  const uVignette = uniform('uVignette')
  const uReveal = uniform('uReveal')

  gl.uniform2f(uFocal, FOCAL_X, FOCAL_Y)

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  // Single dark pixel until the photo decodes.
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

  let photoAspect = 4 / 3
  let loaded = false

  const image = new Image()
  image.decoding = 'async'
  image.src = photoUrl
  void image
    .decode()
    .catch(() => undefined)
    .then(() => {
      if (disposed || !image.naturalWidth) {
        return
      }
      photoAspect = image.naturalWidth / image.naturalHeight
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
      loaded = true
      resize()
    })

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

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio, 2)
    const width = Math.max(1, Math.round(holder.clientWidth * dpr))
    const height = Math.max(1, Math.round(holder.clientHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    gl.viewport(0, 0, width, height)

    // Cover-fit: show the largest centred crop that fills the window.
    const viewAspect = width / height
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

  let disposed = false
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

    reveal += ((loaded ? 1 : 0) - reveal) * 0.06

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

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  rafId = requestAnimationFrame(tick)

  return {
    setPreset,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(rafId)
      observer.disconnect()
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
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
