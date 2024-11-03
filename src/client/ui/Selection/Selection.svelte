<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/constants';

  export let path: Point[];

  $: _render = ({ context, drawer }: RenderProps) => {
    if (!context) return;

    const rect = geometryManager.getRectDimensionFromPath(path);
    if (!rect) return;

    const { x, y, width, height } = rect;

    context.globalAlpha = 0.9;
    drawer.strokeRect({ x, y, width, height, color: COLORS.SELECTION, lineWidth: 2 });
    drawer.fillRect({ x, y, width, height, color: '#35b2dc33' });
    context.globalAlpha = 1;
  };
</script>

<Layer render={_render} />
