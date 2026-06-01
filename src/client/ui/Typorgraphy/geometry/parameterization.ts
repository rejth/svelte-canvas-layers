import type { BoundingBox } from 'opentype.js';

import type { Point } from 'core/interfaces';

import { getBezierCurvePoint } from './math';

/**
 * Arc-Length Parameterization means positioning points along a curve based on the actual distance traveled along the curve, rather than the mathematical parameter.
 * It allows to stretch and compresses the path depending on the curve's length while maintaining the uniform distribution along the curve.
 */

const SEGMENTS = 32;
const ARC_LENGTH_CACHE_CAPACITY = 50;

// Convert x position in text bounds to arc length ratio
export const getArcLengthRatio = (x: number, bounds: BoundingBox, points: Point[]): number => {
  const linearRatio = getLinearRatio(x, bounds);
  const totalLength = getBezierCurveTotalArcLength(points);
  const targetLength = linearRatio * totalLength;

  return arcLengthToParameter(targetLength, points);
};

export const getLinearRatio = (x: number, bounds: BoundingBox): number => {
  // Clamp x to valid range [bounds.x1, bounds.x2] and normalize "t" to [0, 1] for building correct Besizer curve
  return Math.max(0, Math.min(1, (x - bounds.x1) / (bounds.x2 - bounds.x1)));
};

// Calculate the arc length of a Bezier curve from 0 to t using numerical integration
const getBezierCurveArcLength = (t: number, points: Point[], segments = SEGMENTS): number => {
  let length = 0;
  const dt = t / segments;

  for (let i = 0; i < segments; i++) {
    const t1 = i * dt;
    const t2 = (i + 1) * dt;

    const p1 = getBezierCurvePoint(t1, points);
    const p2 = getBezierCurvePoint(t2, points);

    length += Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  return length;
};

// Cache for arc length lookups
let arcLengthCache: ArcLengthLookup | null = null;

// Arc length lookup table for fast parameterization
class ArcLengthLookup {
  private lookupTable: Array<{ t: number; arcLength: number }> = [];
  private totalLength: number = 0;
  private points: Point[] = [];

  constructor(points: Point[], capacity = ARC_LENGTH_CACHE_CAPACITY) {
    this.points = [...points];
    this.buildLookupTable(capacity);
  }

  private buildLookupTable(capacity: number) {
    this.lookupTable = new Array(capacity + 1);

    for (let i = 0; i <= capacity; i++) {
      const t = i / capacity;
      const arcLength = getBezierCurveArcLength(t, this.points);
      this.lookupTable[i] = { t, arcLength };
    }

    this.totalLength = this.lookupTable[this.lookupTable.length - 1].arcLength;
  }

  getTotalLength(): number {
    return this.totalLength;
  }

  // Arc length to parameter conversion using linear interpolation
  arcLengthToParameter(targetLength: number): number {
    if (targetLength <= 0) return 0;
    if (targetLength >= this.totalLength) return 1;

    // Binary search in lookup table
    let low = 0;
    let high = this.lookupTable.length - 1;

    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);

      if (this.lookupTable[mid].arcLength < targetLength) {
        low = mid;
      } else {
        high = mid;
      }
    }

    // Linear interpolation between the two closest points
    const lowEntry = this.lookupTable[low];
    const highEntry = this.lookupTable[high];

    const ratio = (targetLength - lowEntry.arcLength) / (highEntry.arcLength - lowEntry.arcLength);
    return lowEntry.t + ratio * (highEntry.t - lowEntry.t);
  }

  // Check if points have changed (for cache invalidation)
  pointsChanged(newPoints: Point[]): boolean {
    if (newPoints.length !== this.points.length) return true;

    for (let i = 0; i < newPoints.length; i++) {
      if (this.points[i].x !== newPoints[i].x || this.points[i].y !== newPoints[i].y) {
        return true;
      }
    }

    return false;
  }
}

const arcLengthToParameter = (targetLength: number, points: Point[]): number => {
  // Check if we need to rebuild the cache
  if (!arcLengthCache || arcLengthCache.pointsChanged(points)) {
    arcLengthCache = new ArcLengthLookup(points, ARC_LENGTH_CACHE_CAPACITY);
  }

  return arcLengthCache.arcLengthToParameter(targetLength);
};

// Total arc length using cache
const getBezierCurveTotalArcLength = (points: Point[]): number => {
  if (!arcLengthCache || arcLengthCache.pointsChanged(points)) {
    arcLengthCache = new ArcLengthLookup(points, ARC_LENGTH_CACHE_CAPACITY);
  }

  return arcLengthCache.getTotalLength();
};

// Test different segment counts to choose the optimal number of segments to use for arc length calculation
const testAccuracy = (points: Point[]) => {
  const reference = getBezierCurveArcLength(1, points, 1000); // High precision reference

  [10, 20, 50, 100, 200, 500].forEach((segments) => {
    const result = getBezierCurveArcLength(1, points, segments);
    const error = (Math.abs(result - reference) / reference) * 100;
    console.log(`Segments: ${segments}, Error: ${error.toFixed(2)}%`);
  });
};
