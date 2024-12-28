<script lang="ts">
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  import { COLORS } from 'client/shared/constants';

  export let text: string;
  export let pathPoints: (Point & { angle: number })[];

  $: render = ({ ctx }: RenderProps) => {
    if (!ctx) return;

    ctx.font = `130px 'Fira Mono', monospace`;
    ctx.fillStyle = COLORS.SELECTION;

    let overallBBox = {
      xMin: Infinity,
      yMin: Infinity,
      xMax: -Infinity,
      yMax: -Infinity,
    };

    text.split('').forEach((char, i) => {
      const { x, y, angle } = pathPoints[i];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const metrics = ctx.measureText(char);
      const width = metrics.width;
      const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

      // Create the bounding box coordinates for the letter
      const boundingBox = {
        x: x,
        y: y - height,
        width,
        height,
      };

      overallBBox.xMin = Math.min(overallBBox.xMin, boundingBox.x);
      overallBBox.yMin = Math.min(overallBBox.yMin, boundingBox.y);
      overallBBox.xMax = Math.max(overallBBox.xMax, boundingBox.x + boundingBox.width);
      overallBBox.yMax = Math.max(overallBBox.yMax, boundingBox.y + boundingBox.height);

      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    const overallWidth = overallBBox.xMax - overallBBox.xMin;
    const overallHeight = overallBBox.yMax - overallBBox.yMin;

    ctx.strokeStyle = COLORS.STICKER_ORANGE;
    ctx.strokeRect(overallBBox.xMin, overallBBox.yMin, overallWidth, overallHeight);
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
