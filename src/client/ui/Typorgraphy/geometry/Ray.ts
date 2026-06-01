import { Vector } from './Vector';

export class Ray {
  p: Vector;
  v: Vector;

  constructor(p: Vector, v: Vector) {
    // p is the source point and v is the ray direction
    [this.p, this.v] = [p, v];
  }

  /**
   * Assuming the ray describes a parametric line p + tv, it returns the point at the given t
   */
  point(t: number) {
    return this.p.add(this.v.scale(t));
  }

  /**
   * Intersection with another ray.
   * Returns [t,u], i.e., the parameters for the intersection point in both rays parametric space.
   * If no intersection, returns false
   */
  intersectRay(other: Ray) {
    const [p_0, v_0] = [this.p.x, this.v.x];
    const [p_1, v_1] = [this.p.y, this.v.y];
    const [P_0, V_0] = [other.p.x, other.v.x];
    const [P_1, V_1] = [other.p.y, other.v.y];
    const den = v_0 * V_1 - v_1 * V_0;

    if (Math.abs(den) <= Number.EPSILON) {
      return false;
    }

    const t = (V_1 * (P_0 - p_0) + p_1 * V_0 - P_1 * V_0) / den;
    const u = (v_1 * (P_0 - p_0) + p_1 * v_0 - P_1 * v_0) / den;

    return [t, u];
  }

  /**
   * Intersection with line segment ab.
   * Returns the value of the parameter for the intersection or a negative value if no intersection
   */
  intersectSegment(a: Vector, b: Vector) {
    const segmentRay = new Ray(a, b.sub(a));
    const result = this.intersectRay(segmentRay);

    if (result === false) {
      return false;
    }

    const [t, u] = result;
    if (t > 0 && u >= 0 && u <= 1) {
      return t;
    }

    return -1;
  }
}
