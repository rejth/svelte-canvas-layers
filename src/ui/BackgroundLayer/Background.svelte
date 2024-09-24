<script lang="ts">
  import BackgroundLayer from './BackgroundLayer.svelte';
  import { COLORS, type RenderProps } from '../../lib';

  const width = 10;
  const height = 10;
  const radius = 0.5;

  $: render = ({ context, options }: RenderProps) => {
    if (!context) return;

    const { initialPixelRatio, pixelRatio } = options;
    const transform = context.getTransform();

    const offscreenCanvas = new OffscreenCanvas(width, height);
    offscreenCanvas.width = Math.floor(width * pixelRatio);
    offscreenCanvas.height = Math.floor(height * pixelRatio);

    const offscreenContext = offscreenCanvas.getContext('2d')!;
    offscreenContext.scale(pixelRatio, pixelRatio);

    offscreenContext.beginPath();
    offscreenContext.fillStyle = COLORS.GRID;
    offscreenContext.arc(1, 1, radius, 0, 2 * Math.PI);
    offscreenContext.fill();

    const pattern = context.createPattern(offscreenCanvas, 'repeat');
    if (!pattern) return;

    context.save();
    context.setTransform(initialPixelRatio, transform.b, transform.c, initialPixelRatio, transform.e, transform.f);
    context.fillStyle = pattern;
    context.fillRect(
      -transform.e / initialPixelRatio,
      -transform.f / initialPixelRatio,
      window.innerWidth,
      window.innerHeight,
    );
    context.restore();
  };
</script>

<BackgroundLayer {render} />
