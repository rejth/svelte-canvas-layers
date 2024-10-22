<script lang="ts">
  import type { RenderProps, Bounds } from 'core/interfaces';
  import { COLORS } from 'core/constants';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  export let bounds: Bounds;
  export let active: boolean;

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
