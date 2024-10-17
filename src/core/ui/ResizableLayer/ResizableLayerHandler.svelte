<script lang="ts">
  import { getContext } from 'svelte';

  import { COLORS, KEY } from 'core/constants';
  import { type AppContext, type RenderProps } from 'core/interfaces';
  import Layer from 'core/ui/Layer.svelte';

  export let x: number;
  export let y: number;
  export let active: boolean;

  const { renderManager } = getContext<AppContext>(KEY);
  const { geometryManager } = renderManager;

  $: bounds = { x0: x - 6, y0: y - 6, x1: x + 6, y1: y + 6 };

  $: render = ({ context }: RenderProps) => {
    if (!context) return;

    const { x, y, width, height } = geometryManager.getRectDimension(bounds);

    context.fillStyle = active ? COLORS.STICKER_BLUE : COLORS.SELECTION;
    context.fillRect(x, y, width, height);
  };
</script>

<Layer
  {bounds}
  {render}
  on:mouseenter
  on:mouseleave
  on:mousedown
  on:mouseup
  on:touchstart
  on:touchend
/>
