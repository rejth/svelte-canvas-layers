<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let start: Point;
  export let end: Point;
  export let lineWidth: number = 1;

  $: render = ({ renderer }: RenderProps) => {
    renderer.strokeLine({
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      lineWidth,
      color: COLORS.CURVE,
    });
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
