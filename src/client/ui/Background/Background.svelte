<script lang="ts">
  import type { RenderProps } from 'core/interfaces';
  import { BackgroundLayer } from 'core/ui';

  interface BackgroundPatternRendererData {
    context: OffscreenCanvasRenderingContext2D;
  }

  interface BackgroundPatternRenderer {
    (data: BackgroundPatternRendererData): void;
  }

  export let width: number;
  export let height: number;
  export let render: BackgroundPatternRenderer;

  $: _render = ({ context, options }: RenderProps) => {
    if (!context) return;

    const { initialPixelRatio, pixelRatio } = options;
    const transform = context.getTransform();

    const offscreenCanvas = new OffscreenCanvas(width, height);
    offscreenCanvas.width = Math.floor(width * pixelRatio);
    offscreenCanvas.height = Math.floor(height * pixelRatio);

    const offscreenContext = offscreenCanvas.getContext('2d')!;
    offscreenContext.scale(pixelRatio, pixelRatio);

    render({ context: offscreenContext });

    const pattern = context.createPattern(offscreenCanvas, 'repeat');
    if (!pattern) return;

    context.save();
    context.setTransform(
      initialPixelRatio,
      transform.b,
      transform.c,
      initialPixelRatio,
      transform.e,
      transform.f,
    );
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

<BackgroundLayer render={_render} />
