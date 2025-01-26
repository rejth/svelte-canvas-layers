<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let path: Point[];

  $: _render = ({ ctx, renderer }: RenderProps) => {
    if (!ctx) return;

    const rect = geometryManager.getRectDimensionFromPath(path);
    if (!rect) return;

    ctx.globalAlpha = 0.9;
    renderer.strokeRect({ ...rect, color: COLORS.SELECTION, lineWidth: 2 });
    renderer.fillRect({ ...rect, color: '#35b2dc33' });
    ctx.globalAlpha = 1;
  };
</script>

<Layer render={_render} />
