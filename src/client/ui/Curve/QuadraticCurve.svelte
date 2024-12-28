<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let start: Point;
  export let control: Point;
  export let end: Point;
  export let active: boolean = false;

  $: render = ({ renderer }: RenderProps) => {
    const color = active ? COLORS.SELECTION : '#000';
    renderer.strokeQuadraticCurve({ start, control, end, color, lineWidth: 3 });
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
