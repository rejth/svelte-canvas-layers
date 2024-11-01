<script lang="ts">
  import { COLORS } from 'core/constants';
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  export let controlPoints: Point[];
  export let active: boolean = false;

  $: render = ({ context }: RenderProps) => {
    if (!context || controlPoints.length !== 3) return;

    const start = controlPoints[0];
    const control = controlPoints[1];
    const end = controlPoints[2];

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.quadraticCurveTo(control.x, control.y, end.x, end.y);

    context.strokeStyle = active ? COLORS.SELECTION : '#000';
    context.lineWidth = 3;
    context.stroke();
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
