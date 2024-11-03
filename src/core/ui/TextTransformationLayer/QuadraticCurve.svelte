<script lang="ts">
  import { COLORS } from 'core/constants';
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  export let start: Point;
  export let control: Point;
  export let end: Point;
  export let active: boolean = false;

  $: render = ({ drawer }: RenderProps) => {
    const color = active ? COLORS.SELECTION : '#000';
    drawer.strokeQuadraticCurve({ start, control, end, color, lineWidth: 3 });
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
