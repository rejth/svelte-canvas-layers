<script lang="ts">
  import Layer from './Layer.svelte';
  import { type Point, type RenderProps } from '../lib';

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

    context.strokeStyle = 'blue';
    context.lineWidth = 2;
    context.stroke();
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
