import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { Sky } from 'three/addons/objects/Sky.js'
import { createSingaporeFlyer } from './flyer.ts'
import { createWorld } from './world.ts'

export interface ScenePreset {
  title: string
  caption: string
  sun: { x: number; y: number; z: number; color: string; intensity: number }
  sky: {
    turbidity: number
    rayleigh: number
    mieCoefficient: number
    mieDirectionalG: number
  }
  exposure: number
  fog: string
  hemi: { sky: string; ground: string; intensity: number }
  ambient: number
  water: { deep: string; shallow: string }
}

export const SCENES: ScenePreset[] = [
  {
    title: 'Singapore Flyer',
    caption: 'Marina Bay · 10:24 SGT',
    sun: { x: 420, y: 620, z: 180, color: '#fff4dc', intensity: 2.35 },
    sky: { turbidity: 2.4, rayleigh: 1.15, mieCoefficient: 0.0048, mieDirectionalG: 0.82 },
    exposure: 1.08,
    fog: '#9ec7dc',
    hemi: { sky: '#b7d7ee', ground: '#3d5a3f', intensity: 0.72 },
    ambient: 0.22,
    water: { deep: '#0b4d6b', shallow: '#2a8b96' },
  },
  {
    title: 'Golden Hour',
    caption: 'Final approach · 19:08 SGT',
    sun: { x: -540, y: 96, z: -160, color: '#ffb36b', intensity: 1.9 },
    sky: { turbidity: 6.5, rayleigh: 2.9, mieCoefficient: 0.02, mieDirectionalG: 0.94 },
    exposure: 0.98,
    fog: '#d9a077',
    hemi: { sky: '#f4c08a', ground: '#4a3b32', intensity: 0.52 },
    ambient: 0.18,
    water: { deep: '#123a52', shallow: '#d07a45' },
  },
  {
    title: 'Blue Hour',
    caption: 'City lights · 20:41 SGT',
    sun: { x: 220, y: 26, z: -420, color: '#8fa8cf', intensity: 0.75 },
    sky: { turbidity: 9, rayleigh: 3.6, mieCoefficient: 0.008, mieDirectionalG: 0.88 },
    exposure: 0.68,
    fog: '#1d2b45',
    hemi: { sky: '#3a4d6e', ground: '#1c2430', intensity: 0.4 },
    ambient: 0.14,
    water: { deep: '#0a2033', shallow: '#1c4a5e' },
  },
]

export interface SceneHandle {
  setPreset: (index: number) => void
  dispose: () => void
}

export function createSingaporeScene(canvas: HTMLCanvasElement): SceneHandle {
  const holder = canvas.parentElement
  if (!holder) {
    throw new Error('The scene canvas needs a parent element to size against.')
  }

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  const scene = new Scene()
  scene.fog = new Fog('#9ec7dc', 520, 2400)

  const camera = new PerspectiveCamera(42, 1, 0.05, 8000)
  camera.position.set(118, 198, -96)
  camera.lookAt(8, 78, -700)

  const { group: flyer, wheel, capsules } = createSingaporeFlyer()
  flyer.position.set(0, 0, -700)
  flyer.rotation.y = 0.58
  scene.add(flyer)

  const { group: world, waterUniforms } = createWorld()
  world.position.set(0, 0, -700)
  scene.add(world)

  const sky = new Sky()
  sky.scale.setScalar(450000)
  scene.add(sky)

  const sun = new DirectionalLight('#fff4dc', 2.35)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 80
  sun.shadow.camera.far = 1600
  sun.shadow.camera.left = -280
  sun.shadow.camera.right = 280
  sun.shadow.camera.top = 220
  sun.shadow.camera.bottom = -220
  scene.add(sun)

  const hemi = new HemisphereLight('#b7d7ee', '#3d5a3f', 0.72)
  scene.add(hemi)
  const ambient = new AmbientLight('#cdd8e2', 0.22)
  scene.add(ambient)

  const setPreset = (index: number) => {
    const preset = SCENES[((index % SCENES.length) + SCENES.length) % SCENES.length]

    sun.position.set(preset.sun.x, preset.sun.y, preset.sun.z)
    sun.color.set(preset.sun.color)
    sun.intensity = preset.sun.intensity

    const uniforms = sky.material.uniforms
    uniforms['turbidity'].value = preset.sky.turbidity
    uniforms['rayleigh'].value = preset.sky.rayleigh
    uniforms['mieCoefficient'].value = preset.sky.mieCoefficient
    uniforms['mieDirectionalG'].value = preset.sky.mieDirectionalG
    uniforms['sunPosition'].value.copy(sun.position)

    renderer.toneMappingExposure = preset.exposure
    scene.fog = new Fog(preset.fog, 520, 2400)

    hemi.color.set(preset.hemi.sky)
    hemi.groundColor.set(preset.hemi.ground)
    hemi.intensity = preset.hemi.intensity
    ambient.intensity = preset.ambient
    ;(waterUniforms.uDeep.value as Color).set(preset.water.deep)
    ;(waterUniforms.uShallow.value as Color).set(preset.water.shallow)
  }

  setPreset(0)

  const resize = () => {
    const width = Math.max(1, holder.clientWidth)
    const height = Math.max(1, holder.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(holder)

  let rafId = 0
  const started = performance.now()
  const tick = (now: number) => {
    rafId = requestAnimationFrame(tick)
    const elapsed = (now - started) / 1000

    wheel.rotation.z += 0.08 / 60
    for (const capsule of capsules) {
      capsule.rotation.z = -wheel.rotation.z
    }
    waterUniforms.uTime.value = elapsed
    waterUniforms.uSunDir.value.copy(sun.position).normalize()

    // Gentle aircraft drift so the view never sits perfectly still.
    camera.position.y = 198 + Math.sin(elapsed * 0.9) * 0.6
    camera.position.x = 118 + Math.sin(elapsed * 0.5) * 0.8
    camera.lookAt(8, 78, -700)

    renderer.render(scene, camera)
  }
  rafId = requestAnimationFrame(tick)

  return {
    setPreset,
    dispose: () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      renderer.dispose()
    },
  }
}
