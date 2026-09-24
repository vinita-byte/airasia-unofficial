import {
  BoxGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three'

const CAPSULE_COUNT = 28
const WHEEL_RADIUS = 74
const HUB_Y = 82

export function createSingaporeFlyer(): {
  group: Group
  wheel: Group
  capsules: Group[]
} {
  const group = new Group()
  group.name = 'SingaporeFlyer'

  const steel = new MeshStandardMaterial({
    color: new Color('#e7eef3'),
    metalness: 0.74,
    roughness: 0.26,
  })
  const darkSteel = new MeshStandardMaterial({
    color: new Color('#8f99a3'),
    metalness: 0.82,
    roughness: 0.3,
  })
  const white = new MeshStandardMaterial({
    color: new Color('#f5f7f8'),
    metalness: 0.28,
    roughness: 0.42,
  })
  const glass = new MeshPhysicalMaterial({
    color: new Color('#9ec7de'),
    metalness: 0.08,
    roughness: 0.12,
    transparent: true,
    opacity: 0.78,
  })
  const concrete = new MeshStandardMaterial({
    color: new Color('#d5d2c8'),
    roughness: 0.86,
    metalness: 0.04,
  })

  const hub = new Mesh(new CylinderGeometry(6.2, 6.2, 12, 28), steel)
  hub.rotation.z = Math.PI / 2
  hub.position.y = HUB_Y
  hub.castShadow = true
  group.add(hub)

  const hubCap = new Mesh(new SphereGeometry(4.4, 20, 16), steel)
  hubCap.position.y = HUB_Y
  group.add(hubCap)

  const wheel = new Group()
  wheel.position.y = HUB_Y
  group.add(wheel)

  const outerRim = new Mesh(new TorusGeometry(WHEEL_RADIUS, 1.7, 18, 140), steel)
  outerRim.castShadow = true
  outerRim.receiveShadow = true
  wheel.add(outerRim)

  const midRim = new Mesh(new TorusGeometry(WHEEL_RADIUS - 7.5, 0.7, 12, 100), darkSteel)
  wheel.add(midRim)

  for (let i = 0; i < CAPSULE_COUNT; i += 1) {
    const angle = (i / CAPSULE_COUNT) * Math.PI * 2
    const spoke = new Mesh(
      new CylinderGeometry(0.26, 0.26, WHEEL_RADIUS - 1.5, 6),
      darkSteel,
    )
    spoke.rotation.z = angle + Math.PI / 2
    spoke.position.set(
      Math.cos(angle) * ((WHEEL_RADIUS - 1.5) / 2),
      Math.sin(angle) * ((WHEEL_RADIUS - 1.5) / 2),
      0,
    )
    wheel.add(spoke)

    const brace = new Mesh(new CylinderGeometry(0.18, 0.18, 9, 6), darkSteel)
    brace.rotation.y = Math.PI / 2
    brace.position.set(Math.cos(angle) * (WHEEL_RADIUS - 4), Math.sin(angle) * (WHEEL_RADIUS - 4), 0)
    wheel.add(brace)
  }

  const capsules: Group[] = []
  for (let i = 0; i < CAPSULE_COUNT; i += 1) {
    const angle = (i / CAPSULE_COUNT) * Math.PI * 2
    const capsule = createCapsule(white, glass)
    capsule.position.set(
      Math.cos(angle) * (WHEEL_RADIUS + 5.2),
      Math.sin(angle) * (WHEEL_RADIUS + 5.2),
      0,
    )
    wheel.add(capsule)
    capsules.push(capsule)
  }

  addSupportLegs(group, steel, concrete)
  addTerminal(group, white, glass, concrete)

  return { group, wheel, capsules }
}

function createCapsule(
  shell: MeshStandardMaterial,
  glass: MeshPhysicalMaterial,
): Group {
  const capsule = new Group()

  const body = new Mesh(new CapsuleGeometry(2.15, 3.1, 8, 16), shell)
  body.rotation.z = Math.PI / 2
  body.castShadow = true
  capsule.add(body)

  const window = new Mesh(new CapsuleGeometry(1.55, 2.2, 6, 14), glass)
  window.rotation.z = Math.PI / 2
  window.scale.set(0.55, 1, 1.05)
  capsule.add(window)

  const rail = new Mesh(new BoxGeometry(6.4, 0.16, 2.4), shell)
  rail.position.y = -1.7
  capsule.add(rail)

  return capsule
}

function addSupportLegs(
  group: Group,
  steel: MeshStandardMaterial,
  concrete: MeshStandardMaterial,
) {
  const pad = new Mesh(new BoxGeometry(46, 2.2, 22), concrete)
  pad.position.set(0, 1.1, 16)
  pad.receiveShadow = true
  group.add(pad)

  const makeLeg = (x: number) => {
    const leg = new Mesh(new BoxGeometry(4.2, 96, 6.4), steel)
    leg.position.set(x, 46, 14)
    const tilt = Math.atan2(HUB_Y - 46, 14)
    leg.rotation.x = -tilt * 0.85
    leg.castShadow = true
    group.add(leg)

    const outer = new Mesh(new BoxGeometry(3.4, 88, 4.8), steel)
    outer.position.set(x * 1.15, 40, 22)
    outer.rotation.x = -0.42
    outer.rotation.z = x > 0 ? -0.12 : 0.12
    outer.castShadow = true
    group.add(outer)
  }

  makeLeg(-16)
  makeLeg(16)

  const cross = new Mesh(new BoxGeometry(34, 3.2, 4.2), steel)
  cross.position.set(0, 38, 18)
  group.add(cross)
}

function addTerminal(
  group: Group,
  white: MeshStandardMaterial,
  glass: MeshPhysicalMaterial,
  concrete: MeshStandardMaterial,
) {
  const hall = new Mesh(new BoxGeometry(52, 10, 28), white)
  hall.position.set(2, 5, 34)
  hall.castShadow = true
  hall.receiveShadow = true
  group.add(hall)

  const facade = new Mesh(new BoxGeometry(44, 7.2, 0.6), glass)
  facade.position.set(2, 5.4, 48.2)
  group.add(facade)

  const canopy = new Mesh(new BoxGeometry(56, 0.8, 16), white)
  canopy.position.set(2, 10.6, 42)
  canopy.castShadow = true
  group.add(canopy)

  const plaza = new Mesh(new BoxGeometry(80, 0.6, 48), concrete)
  plaza.position.set(4, 0.3, 38)
  plaza.receiveShadow = true
  group.add(plaza)
}
