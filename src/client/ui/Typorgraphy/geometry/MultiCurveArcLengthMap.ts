import type { Bezier } from './BezierCurve';
import type { Vector } from './Vector';

/**
 * Reparameterizes multiple curves (spline) by arc length
 **/
export class MultiCurveArclengthMap {
  curves: Bezier[];
  npts: number;
  segmentLengths: number[];
  totalLength: number;
  lengthMaps: number[][];

  constructor(curves: Bezier[], npts = 40) {
    this.curves = curves;
    this.npts = npts;
    this.segmentLengths = [];
    this.lengthMaps = [];
    this.totalLength = 0;

    // Calculate arc length for each curve segment
    for (let curveIndex = 0; curveIndex < curves.length; curveIndex++) {
      const curve = curves[curveIndex];
      const lengthMap: number[] = [];

      let p = curve.point(0);
      let segmentLength = 0;

      for (let i = 0; i <= npts; i++) {
        const t = i / npts;
        const q = curve.point(t);
        const delta = p.dist(q);
        segmentLength += delta;
        lengthMap[i] = segmentLength;
        p = q;
      }

      this.segmentLengths.push(segmentLength);
      this.lengthMaps.push(lengthMap);
      this.totalLength += segmentLength;
    }
  }

  // Get the arc length at a given normalized position (0-1)
  len(normalizedPosition: number): number {
    return this.totalLength * normalizedPosition;
  }

  // Convert arc length to normalized position (0-1)
  t(arcLength: number): number {
    return Math.max(0, Math.min(1, arcLength / this.totalLength));
  }

  // Get point at global arc length position
  getPointAtLength(length: number): { point: Vector; tangent: Vector } {
    // Clamp length to valid range
    length = Math.max(0, Math.min(this.totalLength, length));

    // Find which curve segment contains this length
    let accumulatedLength = 0;
    let curveIndex = 0;

    for (let i = 0; i < this.segmentLengths.length; i++) {
      if (length <= accumulatedLength + this.segmentLengths[i]) {
        curveIndex = i;
        break;
      }
      accumulatedLength += this.segmentLengths[i];
    }

    // Get local length within the curve segment
    const localLength = length - accumulatedLength;
    const curve = this.curves[curveIndex];
    const lengthMap = this.lengthMaps[curveIndex];

    // Find t parameter for this local length using binary search
    const t = this.findTForLength(localLength, lengthMap);

    return {
      point: curve.point(t),
      tangent: curve.tangent(t),
    };
  }

  // Get point at normalized position (0-1)
  getPointAtNormalizedPosition(normalizedPosition: number): { point: Vector; tangent: Vector } {
    const arcLength = this.len(normalizedPosition);
    return this.getPointAtLength(arcLength);
  }

  private findTForLength(targetLength: number, lengthMap: number[]): number {
    if (targetLength <= 0) return 0;
    if (targetLength >= lengthMap[this.npts]) return 1;

    // Binary search for the correct t value
    let low = 0;
    let high = this.npts;

    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      if (lengthMap[mid] < targetLength) {
        low = mid;
      } else {
        high = mid;
      }
    }

    // Interpolate between the two closest points
    const t1 = low / this.npts;
    const t2 = high / this.npts;
    const len1 = lengthMap[low];
    const len2 = lengthMap[high];

    const ratio = (targetLength - len1) / (len2 - len1);
    return t1 + (t2 - t1) * ratio;
  }
}
