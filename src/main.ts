import './style.css'
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three'
import { Sky } from 'three/addons/objects/Sky.js'
import { createCabin } from './cabin.ts'
import { createSingaporeFlyer } from './flyer.ts'
import { createWorld } from './world.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#view')
const loader = document.querySelector<HTMLDivElement>('#loader')
const errorPanel = document.querySelector<HTMLDivElement>('#error')
const hud = document.querySelector<HTMLDivElement>('#hud')

if (!canvas || !loader || !errorPanel || !hud) {
  throw new Error('The cabin page is missing its markup.')
}

if (!isWebGLAvailable()) {
  loader.hidden = true
  errorPanel.hidden = false
} else {
  startScene(canvas, loader, hud)
}

function isWebGLAvailable() {
  const probe = document.createElement('canvas')
  return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'))
}

function startScene(
  view: HTMLCanvasElement,
  loading: HTMLDivElement,
  chrome: HTMLDivElement,
) {
  const renderer = new WebGLRenderer({
    canvas: view,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  const scene = new Scene()
  scene.background = new Color('#87b7d6')
  scene.fog = new Fog('#9ec7dc', 520, 2400)

  const camera = new PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.05, 8000)

  const rig = new Group()
  rig.position.set(118, 198, -96)
  rig.lookAt(8, 78, -700)
  scene.add(rig)

  const { group: cabin, shade } = createCabin()
  rig.add(cabin)

  const lookPivot = new Group()
  lookPivot.position.set(0, 0, 1.18)
  rig.add(lookPivot)
  lookPivot.add(camera)

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
  sun.position.set(420, 620, 180)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 80
  sun.shadow.camera.far = 1600
  sun.shadow.camera.left = -280
  sun.shadow.camera.right = 280
  sun.shadow.camera.top = 220
  sun.shadow.camera.bottom = -220
  scene.add(sun)

  const skyUniforms = sky.material.uniforms
  skyUniforms['turbidity'].value = 2.4
  skyUniforms['rayleigh'].value = 1.15
  skyUniforms['mieCoefficient'].value = 0.0048
  skyUniforms['mieDirectionalG'].value = 0.82
  skyUniforms['sunPosition'].value.copy(sun.position)

  scene.add(new HemisphereLight('#b7d7ee', '#3d5a3f', 0.72))
  scene.add(new AmbientLight('#cdd8e2', 0.22))

  const pointer = new Vector2()
  const lookTarget = new Vector2()
  const lookCurrent = new Vector2()
  let dragging = false

  const onPointerMove = (event: PointerEvent) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = (event.clientY / window.innerHeight) * 2 - 1
    pointer.set(x, y)
    if (dragging) {
      lookTarget.x = Math.max(-0.18, Math.min(0.18, lookTarget.x + event.movementX * 0.0014))
      lookTarget.y = Math.max(-0.1, Math.min(0.1, lookTarget.y + event.movementY * 0.0012))
    }
  }

  view.addEventListener('pointerdown', (event) => {
    dragging = true
    view.classList.add('is-dragging')
    view.setPointerCapture(event.pointerId)
  })
  view.addEventListener('pointerup', (event) => {
    dragging = false
    view.classList.remove('is-dragging')
    if (view.hasPointerCapture(event.pointerId)) {
      view.releasePointerCapture(event.pointerId)
    }
  })
  view.addEventListener('pointercancel', () => {
    dragging = false
    view.classList.remove('is-dragging')
  })
  view.addEventListener('pointermove', onPointerMove)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  const clockStart = performance.now()
  let opened = false

  const tick = (now: number) => {
    const elapsed = (now - clockStart) / 1000

    wheel.rotation.z += 0.08 * (1 / 60)
    for (const capsule of capsules) {
      capsule.rotation.z = -wheel.rotation.z
    }

    waterUniforms.uTime.value = elapsed
    waterUniforms.uSunDir.value.copy(sun.position).normalize()

    const idleX = pointer.x * 0.035
    const idleY = -pointer.y * 0.02
    lookCurrent.x += (lookTarget.x + idleX - lookCurrent.x) * 0.06
    lookCurrent.y += (lookTarget.y + idleY - lookCurrent.y) * 0.06
    lookPivot.rotation.y = lookCurrent.x
    lookPivot.rotation.x = lookCurrent.y

    rig.position.y = 198 + Math.sin(elapsed * 0.9) * 0.18
    rig.rotation.z = Math.sin(elapsed * 0.7) * 0.002

    const shadeDelay = 0.7
    const shadeDuration = 2.15
    const shadeT = Math.max(0, Math.min(1, (elapsed - shadeDelay) / shadeDuration))
    const eased = 1 - (1 - shadeT) ** 3
    shade.position.y = eased * 1.28

    if (!opened && shadeT > 0.12) {
      opened = true
      loading.hidden = true
      chrome.hidden = false
    }

    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}
