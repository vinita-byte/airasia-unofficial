import {
  Color,
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

export function createCabin(): { group: Group; shade: Mesh } {
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

  const shade = new Mesh(
    new ShapeGeometry(ellipseShape(WINDOW_RX + 0.01, WINDOW_RY + 0.01)),
    new MeshStandardMaterial({
      color: new Color('#1c1f27'),
      roughness: 0.86,
      metalness: 0,
    }),
  )
  shade.position.z = 0.09
  group.add(shade)

  const wash = new SpotLight(0xfff3de, 14, 5, 0.72, 0.55, 1)
  wash.position.set(0.05, 0.18, -1.15)
  wash.target.position.set(0, 0, 0.16)
  group.add(wash)
  group.add(wash.target)

  return { group, shade }
}
