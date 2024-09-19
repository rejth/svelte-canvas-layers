<script lang="ts">
  import { getContext } from 'svelte';

  import Layer from './Layer.svelte';
  import { KEY, type AppContext, type RenderProps, type Bounds, COLORS } from '../lib';

  export let bounds: Bounds;
  export let active: boolean;

  const { renderManager } = getContext<AppContext>(KEY);
  const { geometryManager } = renderManager;

  $: render = ({ context }: RenderProps) => {
    if (!context) return;

    const { x, y, width, height } = geometryManager.getRectDimension(bounds);

    if (active) {
      context.strokeStyle = COLORS.SELECTION;
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);
    }

    context.globalAlpha = 0;
    context.fillRect(x, y, width, height);
    context.globalAlpha = 1;
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
