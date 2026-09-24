import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SpotLight,
  TubeGeometry,
} from 'three'
import { ellipsePath, ellipseShape, OvalCurve } from './oval.ts'

export const WINDOW_RX = 0.4
export const WINDOW_RY = 0.58

/** Vertical travel that fully hides the blind inside the wall above the window. */
export const BLIND_TRAVEL = 1.3

export function createCabin(): { group: Group; blind: Group } {
  const group = new Group()
  group.name = 'Cabin'

  const wallShape = new Shape()
  wallShape.moveTo(-12, -14)
  wallShape.lineTo(12, -14)
  wallShape.lineTo(12, 14)
  wallShape.lineTo(-12, 14)
  wallShape.closePath()
  wallShape.holes.push(ellipsePath(WINDOW_RX, WINDOW_RY))

  const wall = new Mesh(
    new ExtrudeGeometry(wallShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 80,
    }),
    new MeshStandardMaterial({
      color: new Color('#0b0c0f'),
      roughness: 0.92,
      metalness: 0.02,
    }),
  )
  wall.position.z = -0.02
  group.add(wall)

  const pad = new Mesh(
    new TubeGeometry(new OvalCurve(WINDOW_RX + 0.02, WINDOW_RY + 0.02), 160, 0.058, 24, true),
    new MeshStandardMaterial({
      color: new Color('#f3f1ec'),
      roughness: 0.58,
      metalness: 0.04,
    }),
  )
  pad.position.z = 0.145
  group.add(pad)

  const innerLip = new Mesh(
    new TubeGeometry(new OvalCurve(WINDOW_RX - 0.012, WINDOW_RY - 0.012), 128, 0.012, 16, true),
    new MeshStandardMaterial({
      color: new Color('#d9d6cf'),
      roughness: 0.35,
      metalness: 0.18,
    }),
  )
  innerLip.position.z = 0.12
  group.add(innerLip)

  const glass = new Mesh(
    new ShapeGeometry(ellipseShape(WINDOW_RX - 0.01, WINDOW_RY - 0.01)),
    new MeshPhysicalMaterial({
      color: new Color('#d7ebff'),
      transparent: true,
      opacity: 0.07,
      roughness: 0.04,
      metalness: 0,
      transmission: 0,
      reflectivity: 0.35,
    }),
  )
  glass.position.z = 0.07
  group.add(glass)

  const blind = createBlind()
  group.add(blind)

  const wash = new SpotLight(0xfff3de, 14, 5, 0.72, 0.55, 1)
  wash.position.set(0.05, 0.18, -1.15)
  wash.target.position.set(0, 0, 0.16)
  group.add(wash)
  group.add(wash.target)

  return { group, blind }
}

function createBlind(): Group {
  const blind = new Group()
  blind.name = 'WindowBlind'
  blind.position.z = 0.09

  const slatMaterial = new MeshStandardMaterial({
    color: new Color('#cfc8ba'),
    roughness: 0.82,
    metalness: 0.02,
  })

  const panel = new Mesh(
    new ShapeGeometry(ellipseShape(WINDOW_RX + 0.015, WINDOW_RY + 0.015)),
    slatMaterial,
  )
  blind.add(panel)

  // Faint horizontal ribs so the blind reads as a pull-down shade.
  for (let i = -4; i <= 4; i += 1) {
    const y = (i / 5) * WINDOW_RY
    const halfWidth =
      WINDOW_RX * Math.sqrt(Math.max(0.05, 1 - (y / WINDOW_RY) ** 2))
    const rib = new Mesh(
      new BoxGeometry(halfWidth * 2, 0.006, 0.003),
      new MeshStandardMaterial({
        color: new Color('#b9b2a4'),
        roughness: 0.9,
      }),
    )
    rib.position.set(0, y, 0.004)
    blind.add(rib)
  }

  const handle = new Mesh(
    new CylinderGeometry(0.014, 0.014, 0.16, 12),
    new MeshStandardMaterial({
      color: new Color('#8f8878'),
      roughness: 0.5,
      metalness: 0.25,
    }),
  )
  handle.rotation.z = Math.PI / 2
  handle.position.set(0, -WINDOW_RY + 0.1, 0.012)
  blind.add(handle)

  const notch = new Mesh(
    new BoxGeometry(0.09, 0.028, 0.012),
    new MeshStandardMaterial({
      color: new Color('#a49c8c'),
      roughness: 0.6,
    }),
  )
  notch.position.set(0, -WINDOW_RY + 0.1, 0.008)
  blind.add(notch)

  return blind
}
