<script lang="ts">
  import type { RenderProps, Bounds } from 'core/interfaces';
  import { COLORS } from 'core/constants';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  export let bounds: Bounds;
  export let active: boolean;
  export let selectOnMakingConnection: boolean;

  $: render = ({ context }: RenderProps) => {
    if (!context) return;

    const rect = geometryManager.getRectDimensionFromBounds(bounds);
    if (!rect) return;

    const { x, y, width, height } = rect;

    if (active) {
      context.strokeStyle = selectOnMakingConnection ? '#000' : COLORS.SELECTION;
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);
    }

    context.globalAlpha = 0;
    context.fillRect(x, y, width, height);
    context.globalAlpha = 1;
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
