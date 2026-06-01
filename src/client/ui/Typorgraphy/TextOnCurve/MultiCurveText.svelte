<script lang="ts">
  import type { RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  import type { Bezier } from '../geometry/BezierCurve';
  import { MultiCurveArclengthMap } from '../geometry/MultiCurveArcLengthMap';

  export let text: string;
  export let font: string;
  export let curves: Bezier[];
  export let spread = 1;
  export let shift = 0.5;

  $: render = ({ ctx }: RenderProps) => {
    if (!ctx || curves.length === 0) return;

    ctx.font = font;

    const map = new MultiCurveArclengthMap(curves);
    const textLength = ctx.measureText(text).width;
    const delta = (map.len(1) - map.len(0)) * shift - (textLength * spread) / 2;
    const t = [map.t(delta)];

    let lastWidth = 0;
    for (let i = 1; i <= text.length; i++) {
      const wordWidth = ctx.measureText(text.substring(0, i)).width * spread;
      t[i] = map.t(wordWidth + delta);

      const baset = (t[i] + t[i - 1]) / 2;
      const { point: pos, tangent: tan } = map.getPointAtNormalizedPosition(baset);

      // Adjust position by half the character width along the tangent
      const adjustedPos = pos.sub(tan.scale((wordWidth - lastWidth) / 2));

      ctx.save();
      ctx.translate(adjustedPos.x, adjustedPos.y);
      ctx.rotate(Math.atan2(tan.y, tan.x));
      ctx.fillText(text[i - 1], 0, 0);
      ctx.restore();

      lastWidth = wordWidth;
    }
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
