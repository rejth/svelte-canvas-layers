<script lang="ts">
  import { onMount } from 'svelte';
  import type { BoundingBox } from 'opentype.js';

  import { Warp } from 'core/services';
  import type { Point } from 'core/interfaces';

  import Line from 'client/ui/Curve/Line.svelte';
  import BezierCurve from 'client/ui/Curve/BezierCurve.svelte';
  import ControlPoints from 'client/ui/Curve/ControlPoints.svelte';
  import { type CurveLayerEventDetails } from 'client/ui/Curve/interfaces';

  import CompoundPath from '../CompoundPath.svelte';

  import { loadFont } from '../font-utils';
  import { transformPathAlongSingleBezierCurve } from './single-curve';
  import { COLORS } from 'client/shared/constants';

  let controlPoints: Point[] = [
    { x: 100, y: 300 }, // Start
    { x: 200, y: 200 }, // Control 1
    { x: 300, y: 200 }, // Control 2
    { x: 400, y: 300 }, // End
  ];

  let warp: Warp | null = null;
  let originalPathData: Warp['pathData'] = [];
  let originalPath: string = '';
  let compoundPath: string = '';
  let bbox: BoundingBox | null = null;

  onMount(async () => {
    const path = await loadFont('Sample Text', { fontSize: 100 });
    originalPath = path.toPathData(2);
    bbox = path.getBoundingBox();

    // Initialize control points based on text bounding box
    controlPoints[0] = { x: bbox.x1, y: bbox.y2 };
    controlPoints[1] = { x: bbox.x1 + 100, y: bbox.y1 + 200 };
    controlPoints[2] = { x: bbox.x2 - 100, y: bbox.y1 + 200 };
    controlPoints[3] = { x: bbox.x2, y: bbox.y2 };

    warp = new Warp(originalPath);
    warp.interpolate(4);
    warp.transform(([x, y]: number[]) => [x, y, y]);

    originalPathData = warp.pathData;

    warp.transform((points: number[]) => {
      return transformPathAlongSingleBezierCurve(points, bbox!, controlPoints);
    });

    compoundPath = warp.pathString;
  });

  const handlePointMove = (e: CustomEvent<CurveLayerEventDetails>) => {
    if (!e.detail || !warp) return;

    // Update control point position
    controlPoints[e.detail.index] = e.detail.point;

    /*
     * Reset to original path before applying new transformation to avoid accumulative transformations and exponential drift from the original position
     */
    warp.resetPath(originalPathData, originalPath);

    warp.transform((points: number[]) => {
      return transformPathAlongSingleBezierCurve(points, bbox!, controlPoints);
    });

    compoundPath = warp.pathString;
  };
</script>

<CompoundPath {compoundPath} />

<ControlPoints
  stroke={true}
  lineWidth={1}
  color={COLORS.WHITE}
  strokeColor={COLORS.CURVE}
  controlPoints={[...controlPoints]}
  on:point.move={handlePointMove}
>
  <BezierCurve
    start={controlPoints[0]}
    cp1={controlPoints[1]}
    cp2={controlPoints[2]}
    end={controlPoints[3]}
  />
  <Line start={controlPoints[0]} end={controlPoints[1]} lineWidth={1} />
  <Line start={controlPoints[2]} end={controlPoints[3]} lineWidth={1} />
</ControlPoints>
