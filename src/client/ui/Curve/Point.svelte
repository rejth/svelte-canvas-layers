<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  export let point: Point;
  export let stroke: boolean = false;
  export let lineWidth: number = 2;
  export let color: string = '#000';
  export let strokeColor: string = '#000';

  const radius = 5;

  $: render = ({ renderer }: RenderProps) => {
    renderer.fillCircle({
      x: point.x,
      y: point.y,
      radius,
      stroke,
      lineWidth,
      strokeColor,
      color,
    });
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
