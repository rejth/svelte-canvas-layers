<script lang="ts">
  import BackgroundLayer from './BackgroundLayer.svelte';
  import { COLORS, type RenderProps } from '../lib';

  $: render = ({ context, scale }: RenderProps) => {
    if (!context) return;

    const width = 10;
    const height = 10;
    const radius = 0.5;
    const transform = context.getTransform();

    const offscreenCanvas = new OffscreenCanvas(width, height);
    offscreenCanvas.width = Math.floor(width * scale);
    offscreenCanvas.height = Math.floor(height * scale);

    const offscreenContext = offscreenCanvas.getContext('2d')!;
    offscreenContext.scale(scale, scale);
    offscreenContext.beginPath();
    offscreenContext.fillStyle = COLORS.GRID;
    offscreenContext.arc(1, 1, radius, 0, 2 * Math.PI);
    offscreenContext.fill();

    const pattern = context.createPattern(offscreenCanvas, 'repeat');
    if (!pattern) return;

    context.save();
    context.setTransform(scale, transform.b, transform.c, scale, transform.e, transform.f);
    context.fillStyle = pattern;
    context.fillRect(-transform.e / scale, -transform.f / scale, window.innerWidth, window.innerHeight);
    context.restore();
  };
</script>

<BackgroundLayer {render} />
