<script lang="ts">
  import type { RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let x: number;
  export let y: number;
  export let active: boolean;

  const radius = 5;

  $: bounds = { x0: x, y0: y, x1: x, y1: y };

  $: render = ({ renderer }: RenderProps) => {
    const rect = geometryManager.getRectDimensionFromBounds(bounds);
    const color = active ? COLORS.STICKER_BLUE : COLORS.SELECTION;

    renderer.fillCircle({ x: rect.x, y: rect.y, radius, color });
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
  on:click
/>
