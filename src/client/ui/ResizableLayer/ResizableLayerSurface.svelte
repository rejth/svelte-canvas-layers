<script lang="ts">
  import type { RenderProps, Bounds } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let bounds: Bounds;
  export let active: boolean;
  export let selectOnMakingConnection: boolean;

  $: render = ({ ctx, renderer }: RenderProps) => {
    const rect = geometryManager.getRectDimensionFromBounds(bounds);
    if (!rect) return;

    const { x, y, width, height } = rect;

    ctx.globalAlpha = 0;
    renderer.fillRect({ x, y, width, height });
    ctx.globalAlpha = 1;

    if (active) {
      const color = selectOnMakingConnection ? '#000' : COLORS.SELECTION;
      let boundaries = { x: x - 5, y: y - 5, width: width + 10, height: height + 10 };

      if (selectOnMakingConnection) {
        boundaries = { x, y, width, height };
      }

      renderer.strokeRect({ ...boundaries, color, lineWidth: 2 });
    }
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
  on:dblclick
  on:click
/>
