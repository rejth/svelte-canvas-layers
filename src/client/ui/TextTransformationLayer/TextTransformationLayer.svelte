<script lang="ts">
  import type { Point } from 'core/interfaces';

  import Text from './Text.svelte';
  import BezierCurve from '../Curve/BezierCurve.svelte';
  import ControlPoints from '../Curve/ControlPoints.svelte';
  import { type CurveLayerEventDetails } from '../Curve/interfaces';

  export let text: string;

  let controlPoints: Point[] = [
    { x: 100, y: 300 },
    { x: 200, y: 200 },
    { x: 300, y: 200 },
    { x: 400, y: 300 },
  ];

  const handleCurvePointMove = (e: CustomEvent<CurveLayerEventDetails>) => {
    if (!e.detail) return;
    controlPoints[e.detail.index] = e.detail.point;
  };

  const getBezierPoint = (t: number, points: Point[]) => {
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

  const getBezierAngle = (t: number, points: Point[]) => {
    const dx =
      3 * Math.pow(1 - t, 2) * (points[1].x - points[0].x) +
      6 * (1 - t) * t * (points[2].x - points[1].x) +
      3 * Math.pow(t, 2) * (points[3].x - points[2].x);

    const dy =
      3 * Math.pow(1 - t, 2) * (points[1].y - points[0].y) +
      6 * (1 - t) * t * (points[2].y - points[1].y) +
      3 * Math.pow(t, 2) * (points[3].y - points[2].y);

    return Math.atan2(dy, dx);
  };

  const getTextPathPoints = (points: Point[], textLength: number) => {
    return new Array(textLength).fill(null).map((_, i) => {
      const t = i / textLength;
      const { x, y } = getBezierPoint(t, points);
      const angle = getBezierAngle(t, points);
      return { x, y, angle };
    });
  };

  $: pathPoints = getTextPathPoints(controlPoints, text.length);
</script>

<Text {text} {pathPoints} />

<ControlPoints {controlPoints} on:point.move={handleCurvePointMove}>
  <BezierCurve
    start={controlPoints[0]}
    cp1={controlPoints[1]}
    cp2={controlPoints[2]}
    end={controlPoints[3]}
  />
</ControlPoints>
