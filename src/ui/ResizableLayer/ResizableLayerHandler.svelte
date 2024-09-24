<script lang="ts">
  import Layer from '../Layer.svelte';
  import { COLORS, type RenderProps } from '../../lib';

  export let x: number;
  export let y: number;
  export let active: boolean;

  $: render = ({ context }: RenderProps) => {
    if (!context) return;
    context.fillStyle = active ? COLORS.STICKER_BLUE : COLORS.SELECTION;
    context.fillRect(x - 6, y - 6, 12, 12);
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
