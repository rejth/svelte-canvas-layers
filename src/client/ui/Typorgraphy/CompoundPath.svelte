<script lang="ts">
  import type { BoundingBox } from 'opentype.js';

  import { Layer } from 'core/ui';
  import type { RenderProps } from 'core/interfaces';
  import { COLORS } from 'client/shared/constants';

  export let compoundPath: string | null = null;
  export let bbox: BoundingBox | null = null;

  $: _render = ({ ctx }: RenderProps) => {
    if (!compoundPath) return;

    const path = new Path2D(compoundPath);

    ctx.fill(path);

    if (bbox) {
      const { x1, y1, x2, y2 } = bbox;
      ctx.strokeStyle = COLORS.CURVE;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
  };
</script>

<Layer render={_render} />
