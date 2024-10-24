<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/constants';

  export let path: Point[];

  $: _render = ({ context }: RenderProps) => {
    if (!context) return;

    const rect = geometryManager.getRectDimensionFromPath(path);
    if (!rect) return;

    const { x, y, width, height } = rect;

    context.globalAlpha = 0.9;
    context.strokeStyle = COLORS.SELECTION;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);

    context.fillStyle = '#35b2dc33';
    context.fillRect(x, y, width, height);
    context.globalAlpha = 1;
  };
</script>

<Layer render={_render} />
