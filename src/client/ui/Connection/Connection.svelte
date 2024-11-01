<script lang="ts">
  import { getBoxToBoxArrow, type ArrowOptions } from 'perfect-arrows';

  import type { RectDimension } from 'core/interfaces';
  import { Layer, QuadraticCurve, ControlPoints, type CurveLayerEventDetails } from 'core/ui';
  import { COLORS } from 'client/constants';

  import { connectionStore, type ConnectedBox } from './store';
  import { toolbarStore } from '../Toolbar/store';

  type Box = RectDimension | undefined;

  export let connectionId: string | null = null;
  export let source: ConnectedBox | null = null;
  export let target: ConnectedBox | null = null;
  export let selectOnMakingConnection: boolean = false;

  const ARROW_OPTIONS: ArrowOptions = {
    bow: 0.25,
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
      ARROW_OPTIONS,
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
  render={({ context }) => {
    if (!context) return;
    context.beginPath();
    context.arc(sx, sy, 5, 0, Math.PI * 2);
    context.fillStyle = active && !selectOnMakingConnection ? COLORS.SELECTION : '#000';
    context.fill();
  }}
/>

<ControlPoints
  controlPoints={[curvePoint]}
  {selectOnMakingConnection}
  on:point.move={handleCurvePointMove}
  on:point.touch={handleConnectionActive}
  on:point.leave={handleConnectionLeave}
>
  <QuadraticCurve {active} controlPoints={[{ x: sx, y: sy }, controlPoint, { x: ex, y: ey }]} />
</ControlPoints>

<Layer
  render={({ context }) => {
    if (!context) return;
    context.save();
    context.translate(ex + Math.cos(arrowAngle) * 12, ey + Math.sin(arrowAngle) * 12);
    context.rotate(arrowAngle);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-endArrowRadius * 2, -endArrowRadius);
    context.lineTo(-endArrowRadius * 2, endArrowRadius);
    context.closePath();
    context.fillStyle = active && !selectOnMakingConnection ? COLORS.SELECTION : '#000';
    context.fill();
    context.restore();
  }}
/>
