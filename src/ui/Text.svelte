<script lang="ts">
  import Layer from './Layer.svelte';
  import { type Point, type RenderProps } from '../lib';

  export let text: string;
  export let pathPoints: (Point & { angle: number })[];

  $: render = ({ context }: RenderProps) => {
    if (!context) return;

    context.font = '130px Roboto';
    context.fillStyle = 'blue';

    let overallBoundingBox = {
      xMin: Infinity,
      yMin: Infinity,
      xMax: -Infinity,
      yMax: -Infinity,
    };

    text.split('').forEach((char, i) => {
      const { x, y, angle } = pathPoints[i];
      context.save();
      context.translate(x, y);
      context.rotate(angle);

      const metrics = context.measureText(char);
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
      overallBoundingBox.xMax = Math.max(overallBoundingBox.xMax, boundingBox.x + boundingBox.width);
      overallBoundingBox.yMax = Math.max(overallBoundingBox.yMax, boundingBox.y + boundingBox.height);

      context.fillText(char, 0, 0);
      context.restore();
    });

    // Calculate the overall bounding box dimensions
    const overallWidth = overallBoundingBox.xMax - overallBoundingBox.xMin;
    const overallHeight = overallBoundingBox.yMax - overallBoundingBox.yMin;

    context.strokeStyle = 'red';
    context.strokeRect(overallBoundingBox.xMin, overallBoundingBox.yMin, overallWidth, overallHeight);
  };
</script>

<Layer {render} on:mouseenter on:mouseleave on:mousedown on:mouseup on:touchstart on:touchend />
