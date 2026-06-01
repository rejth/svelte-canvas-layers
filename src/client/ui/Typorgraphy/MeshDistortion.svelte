<script lang="ts">
  import { onMount } from 'svelte';
  import type { BoundingBox } from 'opentype.js';

  import { Warp } from 'core/services';
  import type { Point } from 'core/interfaces';

  import ControlPoints from 'client/ui/Curve/ControlPoints.svelte';
  import { type CurveLayerEventDetails } from 'client/ui/Curve/interfaces';
  import Line from 'client/ui/Curve/Line.svelte';
  import QuadraticCurve from 'client/ui/Curve/QuadraticCurve.svelte';
  import CompoundPath from 'client/ui/Typorgraphy/CompoundPath.svelte';
  import { loadFont } from 'client/ui/Typorgraphy/font-utils';

  export let text = 'Sample';
  export let fontSize = 100;
  export let fontFamily = 'Modak';

  let warp: Warp | null = null;
  let originalPathData: Warp['pathData'] = [];
  let originalPath: string = '';
  let compoundPath: string = '';
  let bbox: BoundingBox | null = null;
  let fontLoaded = false;

  // Enhanced mesh with Bézier curve edges: 4 corners + 4 edge control points
  // Starting as a perfect rectangle - middle points are positioned to create straight lines
  let controlPoints: Point[] = [
    { x: 100, y: 100 }, // 0: Top-left corner
    { x: 500, y: 100 }, // 1: Top-right corner
    { x: 100, y: 300 }, // 2: Bottom-left corner
    { x: 500, y: 300 }, // 3: Bottom-right corner
    { x: 300, y: 100 }, // 4: Top edge middle point (on the line)
    { x: 300, y: 300 }, // 5: Bottom edge middle point (on the line)
    { x: 100, y: 200 }, // 6: Left edge middle point (on the line)
    { x: 500, y: 200 }, // 7: Right edge middle point (on the line)
  ];

  // Create a simple quadrilateral from 4 corner points
  const createMeshGrid = (points: Point[]): Point[][] => {
    // Just the 4 corners arranged as a 2x2 grid
    return [
      // Top row
      [points[0], points[1]], // Top-left, Top-right

      // Bottom row
      [points[2], points[3]], // Bottom-left, Bottom-right
    ];
  };

  const interpolatePoint = (p1: Point, p2: Point, t: number): Point => ({
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  });

  // Quadratic Bézier curve interpolation
  const getBezierPoint = (t: number, p0: Point, p1: Point, p2: Point): Point => {
    const oneMinusT = 1 - t;
    return {
      x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
      y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
    };
  };

  // Enhanced mesh transformation using Bézier curves for edges
  const meshTransform = ([x, y]: number[], bbox: BoundingBox, points: Point[]): number[] => {
    if (!bbox || points.length < 8) return [x, y];

    // Normalize coordinates to 0-1 range within bounding box
    const u = (x - bbox.x1) / (bbox.x2 - bbox.x1);
    const v = (y - bbox.y1) / (bbox.y2 - bbox.y1);

    // Clamp to valid range
    const clampedU = Math.max(0, Math.min(1, u));
    const clampedV = Math.max(0, Math.min(1, v));

    // Get control points
    const topLeft = points[0]; // 0: Top-left corner
    const topRight = points[1]; // 1: Top-right corner
    const bottomLeft = points[2]; // 2: Bottom-left corner
    const bottomRight = points[3]; // 3: Bottom-right corner
    const topControl = points[4]; // 4: Top edge control point
    const bottomControl = points[5]; // 5: Bottom edge control point
    const leftControl = points[6]; // 6: Left edge control point
    const rightControl = points[7]; // 7: Right edge control point

    // Interpolate along curved top edge using Bézier curve
    const topEdge = getBezierPoint(clampedU, topLeft, topControl, topRight);

    // Interpolate along curved bottom edge using Bézier curve
    const bottomEdge = getBezierPoint(clampedU, bottomLeft, bottomControl, bottomRight);

    // Interpolate along curved left edge using Bézier curve
    const leftEdge = getBezierPoint(clampedV, topLeft, leftControl, bottomLeft);

    // Interpolate along curved right edge using Bézier curve
    const rightEdge = getBezierPoint(clampedV, topRight, rightControl, bottomRight);

    // Bilinear interpolation between the curved edges
    // This creates a smooth mesh transformation with curved boundaries
    const horizontalBlend = interpolatePoint(topEdge, bottomEdge, clampedV);
    const verticalBlend = interpolatePoint(leftEdge, rightEdge, clampedU);

    // Average the two interpolations for smooth blending
    const result = {
      x: (horizontalBlend.x + verticalBlend.x) * 0.5,
      y: (horizontalBlend.y + verticalBlend.y) * 0.5,
    };

    return [result.x, result.y];
  };

  const loadCustomFont = async () => {
    try {
      const fontFace = new FontFace(fontFamily, 'url(/fonts/Modak-Regular.ttf)');
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      await document.fonts.ready;
      fontLoaded = true;
      initializeWarp();
    } catch (error) {
      console.error('Font loading failed:', error);
      fontLoaded = true;
      initializeWarp();
    }
  };

  const initializeWarp = async () => {
    const path = await loadFont(text, { fontSize });
    originalPath = path.toPathData(2);
    bbox = path.getBoundingBox();

    warp = new Warp(originalPath);
    warp.interpolate(4);
    warp.transform(([x, y]: number[]) => [x, y, y]);
    originalPathData = warp.pathData;

    applyMeshTransformation();
  };

  const applyMeshTransformation = () => {
    if (!warp || !bbox) return;

    warp.resetPath(originalPathData, originalPath);
    warp.transform((points: number[]) => {
      return meshTransform(points, bbox!, controlPoints);
    });
    compoundPath = warp.pathString;
  };

  const handlePointMove = (e: CustomEvent<CurveLayerEventDetails>) => {
    if (!e.detail) return;
    controlPoints[e.detail.index] = e.detail.point;
    applyMeshTransformation();
  };

  onMount(() => {
    loadCustomFont();
  });

  // Helper to create Bézier curve segments for mesh visualization
  const getMeshCurves = (points: Point[]) => {
    if (points.length < 8) return { curves: [], handles: [] };

    const curves = [
      // Top edge curve
      { start: points[0], control: points[4], end: points[1] },
      // Right edge curve
      { start: points[1], control: points[7], end: points[3] },
      // Bottom edge curve
      { start: points[3], control: points[5], end: points[2] },
      // Left edge curve
      { start: points[2], control: points[6], end: points[0] },
    ];

    const handles = [
      // Control handle lines
      { start: points[0], end: points[4] }, // Top-left to top control
      { start: points[1], end: points[4] }, // Top-right to top control
      { start: points[2], end: points[5] }, // Bottom-left to bottom control
      { start: points[3], end: points[5] }, // Bottom-right to bottom control
      { start: points[0], end: points[6] }, // Top-left to left control
      { start: points[2], end: points[6] }, // Bottom-left to left control
      { start: points[1], end: points[7] }, // Top-right to right control
      { start: points[3], end: points[7] }, // Bottom-right to right control
    ];

    return { curves, handles };
  };

  $: meshData = getMeshCurves(controlPoints);

  $: console.log(meshData);
</script>

{#if fontLoaded}
  <CompoundPath {compoundPath} />
{/if}

<ControlPoints
  {controlPoints}
  stroke={true}
  lineWidth={1}
  color="#fff"
  strokeColor="#3af"
  on:point.move={handlePointMove}
>
  <!-- Draw mesh Bézier curves -->
  {#each meshData.curves as curve}
    <QuadraticCurve start={curve.start} control={curve.control} end={curve.end} active={true} />
  {/each}

  <!-- Draw control handle lines -->
  {#each meshData.handles as handle}
    <Line start={handle.start} end={handle.end} lineWidth={1} />
  {/each}
</ControlPoints>
