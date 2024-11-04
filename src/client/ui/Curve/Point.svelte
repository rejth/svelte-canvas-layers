<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let point: Point;
  export let active: boolean = false;

  const radius = 5;

  $: render = ({ drawer }: RenderProps) => {
    const color = active ? COLORS.SELECTION : '#000';
    drawer.fillCircle({ x: point.x, y: point.y, radius, color });
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
