<script lang="ts">
  import type { RenderProps, Bounds } from 'core/interfaces';
  import { COLORS } from 'core/constants';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  export let bounds: Bounds;
  export let active: boolean;
  export let selectOnMakingConnection: boolean;

  $: render = ({ context, drawer }: RenderProps) => {
    const rect = geometryManager.getRectDimensionFromBounds(bounds);
    if (!rect) return;

    const { x, y, width, height } = rect;

    context.globalAlpha = 0;
    drawer.fillRect({ x, y, width, height });
    context.globalAlpha = 1;

    if (active) {
      const color = selectOnMakingConnection ? '#000' : COLORS.SELECTION;
      let boundaries = { x: x - 5, y: y - 5, width: width + 10, height: height + 10 };

      if (selectOnMakingConnection) {
        boundaries = { x, y, width, height };
      }

      drawer.strokeRect({ ...boundaries, color, lineWidth: 2 });
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
/>
