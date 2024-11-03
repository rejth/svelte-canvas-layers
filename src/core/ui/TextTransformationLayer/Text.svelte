<script lang="ts">
  import { COLORS } from 'core/constants';
  import type { Point, RenderProps } from 'core/interfaces';
  import { Layer } from 'core/ui';

  export let text: string;
  export let pathPoints: (Point & { angle: number })[];

  $: render = ({ ctx }: RenderProps) => {
    if (!ctx) return;

    ctx.font = `130px 'Fira Mono', monospace`;
    ctx.fillStyle = COLORS.SELECTION;

    let overallBoundingBox = {
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

      // Update overall bounding box
      overallBoundingBox.xMin = Math.min(overallBoundingBox.xMin, boundingBox.x);
      overallBoundingBox.yMin = Math.min(overallBoundingBox.yMin, boundingBox.y);
      overallBoundingBox.xMax = Math.max(
        overallBoundingBox.xMax,
        boundingBox.x + boundingBox.width,
      );
      overallBoundingBox.yMax = Math.max(
        overallBoundingBox.yMax,
        boundingBox.y + boundingBox.height,
      );

      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // Calculate the overall bounding box dimensions
    const overallWidth = overallBoundingBox.xMax - overallBoundingBox.xMin;
    const overallHeight = overallBoundingBox.yMax - overallBoundingBox.yMin;

    // context.strokeStyle = COLORS.STICKER_ORANGE;
    // context.strokeRect(
    //   overallBoundingBox.xMin,
    //   overallBoundingBox.yMin,
    //   overallWidth,
    //   overallHeight,
    // );
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
