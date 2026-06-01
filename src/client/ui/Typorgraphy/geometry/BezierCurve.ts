import type { Vector } from './Vector';

// Cubic Bézier curve
export class Bezier {
  p: Vector[];

  constructor(p0: Vector, p1: Vector, p2: Vector, p3: Vector) {
    // The four control points
    this.p = [p0, p1, p2, p3];
  }

  update(p0: Vector, p1: Vector, p2: Vector, p3: Vector) {
    this.p = [p0, p1, p2, p3];
    return this;
  }

  // Point at t
  point(t: number) {
    const [p0, p1, p2, p3] = this.p;
    const [p01, p11, p21] = [p0.mix(p1, t), p1.mix(p2, t), p2.mix(p3, t)];
    const [p02, p12] = [p01.mix(p11, t), p11.mix(p21, t)];

    return p02.mix(p12, t);
  }

  // Unit tangent vector at t
  tangent(t: number) {
    const [p0, p1, p2, p3] = this.p;
    const [p01, p11, p21] = [p0.mix(p1, t), p1.mix(p2, t), p2.mix(p3, t)];
    const [p02, p12] = [p01.mix(p11, t), p11.mix(p21, t)];

    return p12.sub(p02).normalize();
  }
}
