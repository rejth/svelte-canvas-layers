<script lang="ts">
  import { getBoxToBoxArrow } from 'perfect-arrows';
  import type { RectDimension, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  type Box = RectDimension | null;

  export let boxA: Box = null;
  export let boxB: Box = null;

  const bow = 0.25;
  const stretch = 0.5;
  const stretchMax = 360;
  const stretchMin = 0;
  const padStart = 0;
  const padEnd = 11;
  const endArrowRadius = 6;

  const flip = false;
  const straights = true;

  const getBoxToBoxConnection = (b1: Box, b2: Box): number[] => {
    if (!b1 || !b2) return [];
    return getBoxToBoxArrow(b1.x, b1.y, b1.width, b1.height, b2.x, b2.y, b2.width, b2.height, {
      padStart,
      padEnd,
      bow,
      straights,
      stretch,
      stretchMax,
      stretchMin,
      flip,
    });
  };

  $: [sx, sy, cx, cy, ex, ey, ae, as, sc] = getBoxToBoxConnection(boxA, boxB);

  $: _render = ({ context }: RenderProps) => {
    if (!context) return;

    // Draw start circle
    context.beginPath();
    context.arc(sx, sy, 4, 0, Math.PI * 2);
    context.fillStyle = '#000';
    context.fill();

    // Draw line between
    context.beginPath();
    context.moveTo(sx, sy);
    context.quadraticCurveTo(cx, cy, ex, ey);
    context.lineWidth = 3;
    context.strokeStyle = '#000';
    context.stroke();

    // Arrowhead configuration
    context.save();
    context.translate(ex + Math.cos(ae) * 12, ey + Math.sin(ae) * 12);
    context.rotate(ae);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-endArrowRadius * 2, -endArrowRadius);
    context.lineTo(-endArrowRadius * 2, endArrowRadius);
    context.closePath();
    context.fillStyle = '#000';
    context.fill();
    context.restore();
  };
</script>

<Layer render={_render} />
