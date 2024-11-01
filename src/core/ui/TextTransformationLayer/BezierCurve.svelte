<script lang="ts">
  import { COLORS } from 'core/constants';
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  export let controlPoints: Point[];
  export let active: boolean = false;

  $: render = ({ context }: RenderProps) => {
    if (!context || controlPoints.length !== 4) return;

    const start = controlPoints[0];
    const cp1 = controlPoints[1];
    const cp2 = controlPoints[2];
    const end = controlPoints[3];

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);

    context.strokeStyle = active ? COLORS.SELECTION : '#000';
    context.lineWidth = 3;
    context.stroke();
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
