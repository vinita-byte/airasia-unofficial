import { Curve, Path, Shape, Vector3 } from 'three'

export class OvalCurve extends Curve<Vector3> {
  rx: number
  ry: number

  constructor(rx: number, ry: number) {
    super()
    this.rx = rx
    this.ry = ry
  }

  getPoint(t: number, optionalTarget = new Vector3()) {
    const angle = t * Math.PI * 2
    return optionalTarget.set(
      Math.cos(angle) * this.rx,
      Math.sin(angle) * this.ry,
      0,
    )
  }
}

export function ellipsePath(rx: number, ry: number): Path {
  const path = new Path()
  path.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0)
  return path
}

export function ellipseShape(rx: number, ry: number): Shape {
  const shape = new Shape()
  shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0)
  return shape
}
