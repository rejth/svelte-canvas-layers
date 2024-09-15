<script lang="ts">
  import { getContext } from 'svelte';

  import Layer from './Layer.svelte';
  import { KEY, type AppContext, type RenderProps, type Bounds, COLORS } from '../lib';

  export let bounds: Bounds;
  export let active: boolean;

  const { renderManager } = getContext<AppContext>(KEY);
  const { geometryManager } = renderManager;

  $: render = ({ ctx }: RenderProps) => {
    if (!ctx) return;

    const { x, y, width, height } = geometryManager.getRectDimension(bounds);

    if (active) {
      ctx.strokeStyle = COLORS.SELECTION;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    }

    ctx.globalAlpha = 0;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
