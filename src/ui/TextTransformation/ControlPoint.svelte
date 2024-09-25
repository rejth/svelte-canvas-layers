<script lang="ts">
  import Layer from 'ui/Layer.svelte';
  import { COLORS } from 'lib/constants';
  import { type Point, type RenderProps } from 'lib/types';

  export let point: Point;
  export let active: boolean;

  $: render = ({ context }: RenderProps) => {
    if (!context) return;

    context.beginPath();
    context.arc(point.x, point.y, 5, 0, Math.PI * 2);
    context.fillStyle = active ? COLORS.STICKER_ORANGE : COLORS.SELECTION;
    context.fill();
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
