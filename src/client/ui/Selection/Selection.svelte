<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let path: Point[];

  $: _render = ({ ctx, drawer }: RenderProps) => {
    if (!ctx) return;

    const rect = geometryManager.getRectDimensionFromPath(path);
    if (!rect) return;

    const { x, y, width, height } = rect;

    ctx.globalAlpha = 0.9;
    drawer.strokeRect({ x, y, width, height, color: COLORS.SELECTION, lineWidth: 2 });
    drawer.fillRect({ x, y, width, height, color: '#35b2dc33' });
    ctx.globalAlpha = 1;
  };
</script>

<Layer render={_render} />
