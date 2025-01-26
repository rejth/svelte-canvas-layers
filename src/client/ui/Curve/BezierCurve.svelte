<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let start: Point;
  export let cp1: Point;
  export let cp2: Point;
  export let end: Point;
  export let active: boolean = false;

  $: render = ({ renderer }: RenderProps) => {
    renderer.strokeBezierCurve({
      start,
      cp1,
      cp2,
      end,
      lineWidth: 3,
      color: active ? COLORS.SELECTION : '#000',
    });
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
