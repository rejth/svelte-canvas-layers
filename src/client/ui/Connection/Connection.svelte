<script lang="ts">
  import { getBoxToBoxArrow, type ArrowOptions } from 'perfect-arrows';

  import type { RectDimension } from 'core/interfaces';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';
  import { type CurveLayerEventDetails } from 'client/ui/Curve/interfaces';
  import QuadraticCurve from 'client/ui/Curve/QuadraticCurve.svelte';
  import ControlPoints from 'client/ui/Curve/ControlPoints.svelte';
  import { toolbarStore } from 'client/ui/Toolbar/store';

  import { connectionStore, type ConnectedBox } from './store';

  type Box = RectDimension | undefined;

  export let connectionId: string | null = null;
  export let source: ConnectedBox | null = null;
  export let target: ConnectedBox | null = null;
  export let selectOnMakingConnection: boolean = false;

  const arrowOptions: ArrowOptions = {
    bow: 0.1,
    stretch: 0.5,
    stretchMin: 0,
    stretchMax: 360,
    padStart: 0,
    padEnd: 11,
    flip: false,
    straights: true,
  };

  const endArrowRadius = 6;
  const t = 0.5;

  let active: boolean = false;
  let isMoving: boolean = false;

  const handleCurvePointMove = (e: CustomEvent<CurveLayerEventDetails>) => {
    if (!e.detail || selectOnMakingConnection) return;
    isMoving = true;
    controlPoint = e.detail.point;
  };

  const handleConnectionActive = () => {
    if (!connectionId || selectOnMakingConnection) return;
    active = true;
    toolbarStore.changeTool(null);
    connectionStore.selectConnection(connectionId, { source: source!, target: target! });
  };

  const handleConnectionLeave = () => {
    if (!connectionId || selectOnMakingConnection) return;
    active = false;
    isMoving = false;
    connectionStore.deselectConnection(connectionId);
  };

  const getBoxToBoxConnection = (source: Box, target: Box): number[] => {
    if (!source || !target) return [];
    return getBoxToBoxArrow(
      source.x,
      source.y,
      source.width,
      source.height,
      target.x,
      target.y,
      target.width,
      target.height,
      arrowOptions,
    );
  };

  $: [sx, sy, cx, cy, ex, ey, _ae, _as, _ac] = getBoxToBoxConnection(source?.box, target?.box);

  $: controlPoint = { x: cx, y: cy };

  $: if (isMoving) {
    let midX = (sx + ex) / 2;
    let midY = (sy + ey) / 2;
    controlPoint = {
      x: 2 * controlPoint.x - midX,
      y: 2 * controlPoint.y - midY,
    };
  }

  $: arrowAngle = Math.atan2(ey - controlPoint.y, ex - controlPoint.x);

  $: curvePoint = {
    x: Math.pow(1 - t, 2) * sx + 2 * (1 - t) * t * controlPoint.x + Math.pow(t, 2) * ex,
    y: Math.pow(1 - t, 2) * sy + 2 * (1 - t) * t * controlPoint.y + Math.pow(t, 2) * ey,
  };
</script>

<Layer
  render={({ renderer }) => {
    const color = active && !selectOnMakingConnection ? COLORS.SELECTION : '#000';
    renderer.fillCircle({ x: sx, y: sy, radius: 5, color });
  }}
/>

<ControlPoints
  controlPoints={[curvePoint]}
  {selectOnMakingConnection}
  on:point.move={handleCurvePointMove}
  on:point.touch={handleConnectionActive}
  on:point.leave={handleConnectionLeave}
>
  <QuadraticCurve {active} start={{ x: sx, y: sy }} control={controlPoint} end={{ x: ex, y: ey }} />
</ControlPoints>

<Layer
  render={({ ctx }) => {
    if (!ctx) return;
    ctx.save();
    ctx.translate(ex + Math.cos(arrowAngle) * 12, ey + Math.sin(arrowAngle) * 12);
    ctx.rotate(arrowAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-endArrowRadius * 2, -endArrowRadius);
    ctx.lineTo(-endArrowRadius * 2, endArrowRadius);
    ctx.closePath();
    ctx.fillStyle = active && !selectOnMakingConnection ? COLORS.SELECTION : '#000';
    ctx.fill();
    ctx.restore();
  }}
/>
