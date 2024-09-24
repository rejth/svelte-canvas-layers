<script lang="ts">
  import { getContext } from 'svelte';

  import ControlPoint from './ControlPoint.svelte';
  import Curve from './Curve.svelte';
  import Text from './Text.svelte';
  import { KEY, type AppContext, type Point } from '../../lib';

  export let text: string;

  const { renderManager } = getContext<AppContext>(KEY);
  const { geometryManager } = renderManager;

  let selectedPoint: number | null = null;
  let controlPoints: Point[] = [
    { x: 100, y: 300 },
    { x: 200, y: 200 },
    { x: 300, y: 200 },
    { x: 400, y: 300 },
  ];

  let draggedHandler: number | null = null;
  let hoveredHandler: number | null = null;

  $: active = draggedHandler !== null || hoveredHandler !== null;

  const onMouseLeave = () => {
    hoveredHandler = null;
  };

  const onMouseUp = () => {
    draggedHandler = null;
    selectedPoint = null;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (selectedPoint === null) return;
    controlPoints[selectedPoint] = geometryManager.calculatePosition(e);
  };

  const onHandlePointMouseEnter = (handle: number) => {
    hoveredHandler = handle;
  };

  const onHandleMouseDown = (handle: number) => {
    draggedHandler = handle;
    selectedPoint = handle;
  };

  const getPathPoints = (points: Point[], textLength: number) => {
    return new Array(textLength).fill(null).map((_, i) => {
      const t = i / textLength;
      const { x, y } = getBezierPoint(t, points);
      const angle = getBezierAngle(t, points);
      return { x, y, angle };
    });
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

  const cursor = (node: HTMLElement, _: unknown) => ({
    update: (cursorType: string) => (node.style.cursor = cursorType),
  });

  $: pathPoints = getPathPoints(controlPoints, text.length);
</script>

<svelte:body use:cursor={active ? 'pointer' : 'auto'} on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<Text {text} {pathPoints} />
<Curve {controlPoints} />

{#each controlPoints as point, index}
  <ControlPoint
    {point}
    active={hoveredHandler === index || draggedHandler === index}
    on:mouseleave={onMouseLeave}
    on:mouseenter={() => onHandlePointMouseEnter(index)}
    on:mousedown={() => onHandleMouseDown(index)}
  />
{/each}
