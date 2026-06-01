<script lang="ts">
  import { onMount } from 'svelte';

  import type { Point } from 'core/interfaces';

  import type { CurveLayerEventDetails } from './interfaces';
  import ControlPoints from './ControlPoints.svelte';
  import BezierCurve from './BezierCurve.svelte';
  import Line from './Line.svelte';
  import MultiCurveText from '../Typorgraphy/TextOnCurve/MultiCurveText.svelte';
  import { Bezier } from '../Typorgraphy/geometry/BezierCurve';
  import { Vector } from '../Typorgraphy/geometry/Vector';
  import { COLORS } from 'client/shared/constants';

  const text = 'Sample Text';
  const fontSize = 100;
  const fontFamily = 'Modak';
  let font = `${fontSize}px sans-serif`;
  let fontLoaded = false;

  let spline = [
    [481, 208],
    [437, 186],
    [469, 45],
    [568, 91],
    [667, 137],
    [652, 268],
    [550, 310],
    // [448, 352],
    // [407, 268],
    // [320, 276],
    // [233, 284],
    // [284, 180],
    // [236, 138],
    // [188, 96],
    // [112, 158],
    // [159, 193],
  ];

  let curves: Bezier[] = [];
  let handles: Point[][] = [];
  let allControlPoints: Point[] = [];
  let controlPointToSplineIndex: number[] = [];

  $: computeSpline();

  $: computeSpline = () => {
    curves.length = 0;
    handles.length = 0;
    allControlPoints.length = 0;
    controlPointToSplineIndex.length = 0;

    // Create control points for all spline points (handles and knots)
    for (let i = 0; i < spline.length; i++) {
      const [x, y] = spline[i];
      allControlPoints.push({ x, y });
      controlPointToSplineIndex.push(i);
    }

    // Compute curves
    for (let i = 0; i < (spline.length - 2) / 3; i++) {
      const points = spline.slice(3 * i, 3 * i + 4);
      const p = points.flat();
      const curve = new Bezier(
        new Vector(p[0], p[1]),
        new Vector(p[2], p[3]),
        new Vector(p[4], p[5]),
        new Vector(p[6], p[7]),
      );
      const curvePoints = curve.p;
      const leftHandle = [curvePoints[0], curvePoints[1]];
      const rightHandle = [curvePoints[2], curvePoints[3]];

      curves.push(curve);
      handles.push(leftHandle, rightHandle);
    }
  };

  const vAdd = (a: number[], b: number[]) => {
    return [a[0] + b[0], a[1] + b[1]];
  };

  const vSub = (a: number[], b: number[]) => {
    return [a[0] - b[0], a[1] - b[1]];
  };

  const handlePointMove = (e: CustomEvent<CurveLayerEventDetails>) => {
    if (!e.detail) return;

    const { index: controlPointIndex, point } = e.detail;
    const { x, y } = point;

    // Map control point index to spline index
    const splineIndex = controlPointToSplineIndex[controlPointIndex];

    // Calculate the movement delta
    const oldX = spline[splineIndex][0];
    const oldY = spline[splineIndex][1];
    const deltaX = x - oldX;
    const deltaY = y - oldY;

    if (splineIndex % 3 == 0) {
      // We're dragging a knot, so move the handles with it (relative movement)
      spline[splineIndex] = [x, y];

      // Move adjacent handles by the same delta
      if (splineIndex > 0) {
        spline[splineIndex - 1] = [
          spline[splineIndex - 1][0] + deltaX,
          spline[splineIndex - 1][1] + deltaY,
        ];
      }
      if (splineIndex < spline.length - 1) {
        spline[splineIndex + 1] = [
          spline[splineIndex + 1][0] + deltaX,
          spline[splineIndex + 1][1] + deltaY,
        ];
      }
    } else {
      // We're dragging a handle
      spline[splineIndex] = [x, y];

      // Figure out which handle is its "mirror"
      const m = splineIndex % 3 == 1 ? splineIndex - 2 : splineIndex + 2;
      if (m >= 0 && m < spline.length) {
        // Find the knot between them
        const k = splineIndex % 3 == 1 ? splineIndex - 1 : splineIndex + 1;
        // Set the mirror handle so that it's symmetric with the one being moved
        spline[m] = vAdd(spline[k], vSub(spline[k], spline[splineIndex]));
      }
    }
  };

  const loadCustomFont = async () => {
    try {
      const fontFace = new FontFace(fontFamily, 'url(/fonts/Modak-Regular.ttf)', {
        style: 'normal',
        weight: 'normal',
      });

      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);

      await document.fonts.ready;

      const isFontReady = document.fonts.check(`${fontSize}px ${fontFamily}`);

      if (isFontReady) {
        font = `${fontSize}px ${fontFamily}, sans-serif`;
        fontLoaded = true;
      } else {
        throw new Error('Font failed to load properly');
      }
    } catch (error) {
      fontLoaded = true;
    }
  };

  onMount(() => {
    loadCustomFont();
  });
</script>

<MultiCurveText {text} {font} {curves} />

<ControlPoints
  controlPoints={allControlPoints}
  stroke={true}
  lineWidth={1}
  color={COLORS.WHITE}
  strokeColor={COLORS.CURVE}
  on:point.move={handlePointMove}
>
  {#each curves as curve}
    <BezierCurve start={curve.p[0]} cp1={curve.p[1]} cp2={curve.p[2]} end={curve.p[3]} />
  {/each}

  {#each handles as handle}
    <Line start={handle[0]} end={handle[1]} />
  {/each}
</ControlPoints>
