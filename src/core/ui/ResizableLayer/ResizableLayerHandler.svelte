<script lang="ts">
  import type { RenderProps } from 'core/interfaces';
  import { COLORS } from 'core/constants';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  export let x: number;
  export let y: number;
  export let active: boolean;

  $: bounds = { x0: x - 6, y0: y - 6, x1: x + 6, y1: y + 6 };

  $: render = ({ context }: RenderProps) => {
    if (!context) return;

    const rect = geometryManager.getRectDimensionFromBounds(bounds);
    if (!rect) return;

    const { x, y, width, height } = rect;

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
