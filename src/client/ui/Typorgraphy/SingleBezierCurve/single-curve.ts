import type { BoundingBox } from 'opentype.js';

import type { Point } from 'core/interfaces';

import { getArcLengthRatio } from '../geometry/parameterization';
import {
  getBezierCurvePoint,
  getBezierCurveTangentVector,
  normalizeBezierCurveTangentVector,
} from '../geometry/math';

export const transformPathAlongSingleBezierCurve = (
  [x, _y, oy]: number[],
  bbox: BoundingBox,
  controlPoints: Point[],
) => {
  /**
   * Parameter mapping (arc-length parameterization)
   *
   * Each x-coordinate in the path's bounds maps to the "t" parameter on the cubic Bezier curve (0 = start, 1 = end).
   * Map each path position along the path's natural width to a corresponding position along the curve.
   *
   * 1. x: Position along the curve
   * 2. y: Position along the baseline
   * 3. oy: Original baseline position
   * 4. curvePoint: Position on the curve at parameter t
   * 5. tangent: Tangent vector at parameter t
   * 6. normalizedTangent: Normalized tangent vector
   */

  // Arc-length parameterization
  const t = getArcLengthRatio(x, bbox, controlPoints);

  // Get the position on the Bezier curve at parameter t (dual or single curve)
  const curvePoint = getBezierCurvePoint(t, controlPoints);

  /**
   * Local Coordinate Transformation
   *
   * At each point on the curve, create a local coordinate system using the tangent and normal vectors where:
   * 1. The tangent vector points along the curve direction
   * 2. The normal vector points perpendicular to the curve
   * 3. The local coordinate system uses the tangent as the x-axis and the normal as the y-axis
   */

  // Get the tangent vector at the "t" parameter (dual or single curve)
  const tangent = getBezierCurveTangentVector(t, controlPoints);

  // Normalize the tangent vector
  const normalizedTangent = normalizeBezierCurveTangentVector(tangent);

  // Handle degenerate case where tangent is zero (zero-length tangent vector when curve is horizontal)
  if (normalizedTangent.y === 0) {
    return [curvePoint.x, curvePoint.y];
  }

  // Calculate the normal vector (perpendicular to tangent vector)
  const normal = {
    x: -normalizedTangent.y,
    y: normalizedTangent.x,
  };

  /**
   * Baseline Mapping (point transformation)
   *
   * The path's baseline follows the curve, and height extends perpendicular to the curve:
   * 1. Baseline follows curve: curvePoint is the new baseline position
   * 2. Height extends perpendicular: normal * offsetFromBaseline moves points perpendicular to curve
   * 3. Preserves relative path height: offsetFromBaseline maintains original distance from baseline
   *
   * Each path point is relocated to:
   * 1. Base position: The corresponding point on the curve
   * 2. Offset: Plus the normal vector scaled by the distance from the original baseline
   *
   * This creates the effect where the path "flows" along the curve while maintaining its relative character spacing and heights.
   */

  // Calculate the offset from the original baseline (oy) - distance from the path's original baseline
  const offsetFromBaseline = oy - bbox.y1;

  // Transform the point: curve position + normal offset
  return [
    curvePoint.x + normal.x * offsetFromBaseline,
    curvePoint.y + normal.y * offsetFromBaseline,
  ];
};
