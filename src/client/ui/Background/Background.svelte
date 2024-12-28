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

  $: _render = ({ ctx, renderer }: RenderProps) => {
    if (!ctx) return;

    // TODO: move to Drawer
    const { initialPixelRatio, pixelRatio } = renderer.getCanvasOptions();
    const transform = ctx.getTransform();

    const offscreenCanvas = new OffscreenCanvas(width, height);
    offscreenCanvas.width = Math.floor(width * pixelRatio);
    offscreenCanvas.height = Math.floor(height * pixelRatio);

    const offscreenContext = offscreenCanvas.getContext('2d')!;
    offscreenContext.scale(pixelRatio, pixelRatio);

    render({ context: offscreenContext });

    const pattern = ctx.createPattern(offscreenCanvas, 'repeat');
    if (!pattern) return;

    ctx.save();
    ctx.setTransform(
      initialPixelRatio,
      transform.b,
      transform.c,
      initialPixelRatio,
      transform.e,
      transform.f,
    );
    ctx.fillStyle = pattern;
    ctx.fillRect(
      -transform.e / initialPixelRatio,
      -transform.f / initialPixelRatio,
      window.innerWidth,
      window.innerHeight,
    );
    ctx.restore();
  };
</script>

<BackgroundLayer render={_render} />
