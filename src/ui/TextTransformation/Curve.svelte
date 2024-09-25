<script lang="ts">
  import Layer from 'ui/Layer.svelte';
  import { COLORS } from 'lib/constants';
  import { type Point, type RenderProps } from 'lib/types';

  export let controlPoints: Point[];

  $: render = ({ context }: RenderProps) => {
    if (!context) return;

    const start = controlPoints[0];
    const cp1 = controlPoints[1];
    const cp2 = controlPoints[2];
    const end = controlPoints[3];

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);

    context.strokeStyle = COLORS.SELECTION;
    context.lineWidth = 2;
    context.stroke();
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
