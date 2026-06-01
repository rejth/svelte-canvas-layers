import type { Point } from 'core/interfaces';

// Get the position on the Bezier curve at parameter t
export const getBezierCurvePoint = (t: number, points: Point[]): Point => {
  const x =
    Math.pow(1 - t, 3) * points[0].x +
    3 * Math.pow(1 - t, 2) * t * points[1].x +
    3 * (1 - t) * Math.pow(t, 2) * points[2].x +
    Math.pow(t, 3) * points[3].x;

  const y =
    Math.pow(1 - t, 3) * points[0].y +
    3 * Math.pow(1 - t, 2) * t * points[1].y +
    3 * (1 - t) * Math.pow(t, 2) * points[2].y +
    Math.pow(t, 3) * points[3].y;

  return { x, y };
};

// Get the tangent vector of the Bezier curve at parameter t
export const getBezierCurveTangentVector = (t: number, points: Point[]): Point => {
  const dx =
    3 * Math.pow(1 - t, 2) * (points[1].x - points[0].x) +
    6 * (1 - t) * t * (points[2].x - points[1].x) +
    3 * Math.pow(t, 2) * (points[3].x - points[2].x);

  const dy =
    3 * Math.pow(1 - t, 2) * (points[1].y - points[0].y) +
    6 * (1 - t) * t * (points[2].y - points[1].y) +
    3 * Math.pow(t, 2) * (points[3].y - points[2].y);

  return { x: dx, y: dy };
};

// Normalize the tangent vector
export const normalizeBezierCurveTangentVector = (tangent: Point): Point => {
  const tangentLength = Math.hypot(tangent.x, tangent.y);

  // Handle degenerate case where tangent is zero (zero-length vector)
  if (tangentLength < 1e-10) {
    return { x: 1, y: 0 }; // Default to horizontal direction
  }

  return {
    x: tangent.x / tangentLength,
    y: tangent.y / tangentLength,
  };
};
