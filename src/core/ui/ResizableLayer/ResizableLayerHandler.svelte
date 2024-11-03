<script lang="ts">
  import type { RenderProps } from 'core/interfaces';
  import { COLORS } from 'core/constants';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  export let x: number;
  export let y: number;
  export let active: boolean;

  const radius = 5;

  $: bounds = { x0: x, y0: y, x1: x, y1: y };

  $: render = ({ drawer }: RenderProps) => {
    const rect = geometryManager.getRectDimensionFromBounds(bounds);
    if (!rect) return;

    const { x, y } = rect;
    const color = active ? COLORS.STICKER_BLUE : COLORS.SELECTION;
    drawer.fillCircle({ x, y, radius, color });
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
