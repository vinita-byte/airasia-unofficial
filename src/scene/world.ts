import {
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  type IUniform,
  Vector3,
} from 'three'

const dummy = new Object3D()

export type WaterUniforms = Record<string, IUniform>

export function createWorld(): {
  group: Group
  waterUniforms: WaterUniforms
} {
  const group = new Group()
  group.name = 'Singapore'

  const water = createWater()
  group.add(water)
  group.add(createPark())
  group.add(createDistantLand())
  group.add(createTrees())
  group.add(createCity())
  group.add(createBoats())
  group.add(createClouds())

  const waterUniforms = (water.material as ShaderMaterial).uniforms
  return { group, waterUniforms }
}

function createWater(): Mesh {
  const uniforms: WaterUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: new Vector3(0.42, 0.78, 0.18).normalize() },
    uDeep: { value: new Color('#0b4d6b') },
    uShallow: { value: new Color('#2a8b96') },
  }

  const material = new ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      varying vec3 vWorld;
      varying vec3 vNormal;

      void main() {
        float waves = sin(vWorld.x * 0.045 + uTime * 0.55) * 0.35
          + sin(vWorld.z * 0.06 - uTime * 0.4) * 0.3
          + sin((vWorld.x + vWorld.z) * 0.09 + uTime * 0.8) * 0.18;
        vec3 normal = normalize(vNormal + vec3(waves * 0.12, 0.0, waves * 0.1));
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
        float sparkle = pow(max(dot(reflect(-uSunDir, normal), viewDir), 0.0), 48.0);
        vec3 color = mix(uDeep, uShallow, fresnel * 0.65 + 0.2);
        color += sparkle * vec3(0.85, 0.9, 0.8);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })

  const water = new Mesh(new PlaneGeometry(4200, 4200), material)
  water.rotation.x = -Math.PI / 2
  water.name = 'BayWater'
  return water
}

function createPark(): Mesh {
  const park = new Mesh(
    new PlaneGeometry(420, 360),
    new MeshStandardMaterial({
      map: createParkTexture(),
      roughness: 0.95,
      metalness: 0,
    }),
  )
  park.rotation.x = -Math.PI / 2
  park.position.set(10, 0.08, 8)
  park.receiveShadow = true
  return park
}

function createParkTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not paint the park texture.')
  }

  ctx.fillStyle = '#3f7d46'
  ctx.fillRect(0, 0, 1024, 1024)

  for (let i = 0; i < 90; i += 1) {
    const green = 90 + Math.floor(Math.random() * 55)
    ctx.fillStyle = `rgba(${36 + Math.floor(Math.random() * 40)}, ${green}, ${40 + Math.floor(Math.random() * 28)}, 0.34)`
    ctx.beginPath()
    ctx.ellipse(
      Math.random() * 1024,
      Math.random() * 1024,
      28 + Math.random() * 90,
      20 + Math.random() * 70,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  ctx.strokeStyle = '#6a6d70'
  ctx.lineWidth = 16
  ctx.beginPath()
  ctx.ellipse(520, 590, 210, 160, 0.15, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#8a8d90'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(80, 820)
  ctx.quadraticCurveTo(400, 700, 940, 760)
  ctx.stroke()

  ctx.fillStyle = '#c5c0b0'
  ctx.fillRect(430, 470, 150, 90)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function createDistantLand(): Mesh {
  const land = new Mesh(
    new PlaneGeometry(1600, 900),
    new MeshStandardMaterial({
      color: new Color('#4b7d4e'),
      roughness: 1,
      metalness: 0,
    }),
  )
  land.rotation.x = -Math.PI / 2
  land.position.set(-420, 0.04, -180)
  land.receiveShadow = true
  return land
}

function createTrees(): Group {
  const trees = new Group()
  const trunkMat = new MeshStandardMaterial({ color: new Color('#5b3d2a'), roughness: 1 })
  const leafMat = new MeshStandardMaterial({ color: new Color('#2f8a46'), roughness: 0.9 })
  const palmMat = new MeshStandardMaterial({ color: new Color('#24864a'), roughness: 0.85 })

  const count = 86
  const trunks = new InstancedMesh(new CylinderGeometry(0.45, 0.7, 4.2, 6), trunkMat, count)
  const canopies = new InstancedMesh(new SphereGeometry(3.4, 8, 6), leafMat, count)
  const palms = new InstancedMesh(new ConeGeometry(3.2, 4.6, 7), palmMat, 24)
  trunks.castShadow = true
  canopies.castShadow = true
  palms.castShadow = true

  let placed = 0
  while (placed < count) {
    const x = (Math.random() - 0.5) * 380
    const z = (Math.random() - 0.5) * 300
    if (Math.hypot(x, z - 20) < 58) {
      continue
    }

    dummy.position.set(x + 8, 2.1, z + 10)
    dummy.rotation.set(0, Math.random() * Math.PI, 0)
    dummy.scale.setScalar(0.7 + Math.random() * 0.85)
    dummy.updateMatrix()
    trunks.setMatrixAt(placed, dummy.matrix)

    dummy.position.y += 3.4
    dummy.scale.y *= 0.75
    dummy.updateMatrix()
    canopies.setMatrixAt(placed, dummy.matrix)
    placed += 1
  }

  for (let i = 0; i < 24; i += 1) {
    dummy.position.set((Math.random() - 0.5) * 300 + 40, 4.4, 70 + Math.random() * 90)
    dummy.rotation.set(0, Math.random() * Math.PI, 0)
    dummy.scale.setScalar(0.8 + Math.random() * 0.6)
    dummy.updateMatrix()
    palms.setMatrixAt(i, dummy.matrix)
  }

  trees.add(trunks, canopies, palms)
  return trees
}

function createCity(): Group {
  const city = new Group()
  city.position.set(-310, 0, -30)

  const materials = [
    new MeshStandardMaterial({ color: new Color('#9bb8c9'), metalness: 0.55, roughness: 0.28 }),
    new MeshStandardMaterial({ color: new Color('#d8d2c4'), roughness: 0.7, metalness: 0.08 }),
    new MeshStandardMaterial({ color: new Color('#6f7c86'), metalness: 0.4, roughness: 0.45 }),
  ]

  for (let i = 0; i < 46; i += 1) {
    const width = 10 + Math.random() * 16
    const depth = 10 + Math.random() * 16
    const height = 16 + Math.random() * 92
    const building = new Mesh(new BoxGeometry(width, height, depth), materials[i % materials.length])
    building.position.set(
      (Math.random() - 0.5) * 280,
      height / 2,
      (Math.random() - 0.5) * 220,
    )
    building.castShadow = true
    building.receiveShadow = true
    city.add(building)
  }

  const towerA = new Mesh(
    new BoxGeometry(18, 148, 18),
    new MeshStandardMaterial({ color: new Color('#cfd8df'), metalness: 0.5, roughness: 0.32 }),
  )
  towerA.position.set(-20, 74, 10)
  towerA.castShadow = true
  city.add(towerA)

  const towerB = new Mesh(
    new BoxGeometry(16, 132, 16),
    new MeshStandardMaterial({ color: new Color('#b7c6d0'), metalness: 0.48, roughness: 0.3 }),
  )
  towerB.position.set(18, 66, -24)
  towerB.castShadow = true
  city.add(towerB)

  return city
}

function createBoats(): Group {
  const boats = new Group()
  const hull = new MeshStandardMaterial({ color: new Color('#f2f4f6'), roughness: 0.45 })

  const spots = [
    [160, 0.8, 210],
    [220, 0.8, 90],
    [90, 0.8, 250],
    [-90, 0.8, 280],
  ]

  for (const [x, y, z] of spots) {
    const boat = new Mesh(new BoxGeometry(14, 1.6, 4.4), hull)
    boat.position.set(x, y, z)
    boat.rotation.y = Math.random() * 0.6
    boats.add(boat)
  }

  return boats
}

function createClouds(): Group {
  const clouds = new Group()
  const puff = new MeshStandardMaterial({
    color: new Color('#ffffff'),
    transparent: true,
    opacity: 0.55,
    roughness: 1,
    depthWrite: false,
  })

  const patches = [
    [220, 210, -180, 70],
    [-160, 240, -320, 90],
    [80, 260, 140, 60],
    [-300, 230, 80, 80],
  ]

  for (const [x, y, z, scale] of patches) {
    const cloud = new Mesh(new SphereGeometry(1, 10, 8), puff)
    cloud.position.set(x, y, z)
    cloud.scale.set(scale, scale * 0.38, scale * 0.7)
    clouds.add(cloud)
  }

  return clouds
}
