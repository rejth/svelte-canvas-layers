<script lang="ts">
  import type { BackgroundPatternRendererData, RenderProps } from 'core/interfaces';
  import { BackgroundLayer } from 'core/ui';

  $: render = ({ renderer }: RenderProps) => {
    renderer.renderBackground(10, 10, ({ ctx }: BackgroundPatternRendererData) => {
      ctx.beginPath();
      ctx.fillStyle = '#d2d6db';
      ctx.arc(1, 1, 0.5, 0, 2 * Math.PI);
      ctx.fill();
    });
  };
</script>

<BackgroundLayer {render} />
