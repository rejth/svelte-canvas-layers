export function split(p, t = 0.5) {
  const seg0 = [];
  const seg1 = [];
  const orders = [p];

  while (orders.length < p.length) {
    const q = orders[orders.length - 1];
    const r = [];

    for (let i = 1; i < q.length; i++) {
      const q0 = q[i - 1];
      const q1 = q[i];
      const s = [];
      const dim = Math.max(q0.length, q1.length);

      for (let j = 0; j < dim; j++) {
        const s0 = q0[j] || 0;
        const s1 = q1[j] || 0;

        s.push(s0 + (s1 - s0) * t);
      }

      r.push(s);
    }

    orders.push(r);
  }

  for (let i = 0; i < orders.length; i++) {
    seg0.push(orders[i][0]);
    seg1.push(orders[orders.length - 1 - i][i]);
  }

  return [seg0, seg1];
}

export function until(points, threshold, deltaFunction = euclideanDistance) {
  const stack = [points];
  const segments = [];

  while (stack.length > 0) {
    const currentPoints = stack.pop();

    if (deltaFunction(currentPoints) > threshold) {
      const newPoints = split(currentPoints);

      // Add new segments backwards so they end up in correct order
      for (let i = newPoints.length - 1; i >= 0; i--) {
        stack.push(newPoints[i]);
      }
    } else {
      segments.push(currentPoints);
    }
  }

  return segments;
}

export function euclideanDistance(points) {
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  let d2 = 0;

  for (let i = 0; i < startPoint.length; i++) {
    const d = endPoint[i] - startPoint[i];
    d2 += d ** 2;
  }

  return Math.sqrt(d2);
}

export function arcLengthDistance(points) {
  if (points.length < 2) return 0;
  if (points.length === 2) {
    // Line segment - euclidean distance is correct
    return euclideanDistance(points);
  }

  // For curves, calculate actual arc length
  const segments = 32; // Adjust for accuracy vs performance
  let totalLength = 0;

  for (let i = 0; i < segments; i++) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;

    const p1 = getBezierCurvePoint(points, t1);
    const p2 = getBezierCurvePoint(points, t2);

    totalLength += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  }

  return totalLength;
}

function getBezierCurvePoint(t, points) {
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

  return [x, y];
}
