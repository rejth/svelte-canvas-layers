<script lang="ts">
  import { onMount } from 'svelte';

  import Canvas from './ui/Canvas.svelte';
  import ResizableLayer from './ui/ResizableLayer.svelte';
  import Layer from './ui/Layer.svelte';
  import Background from './ui/Background.svelte';
  import Zoom from './ui/Zoom/Zoom.svelte';
  import UndoRedo from './ui/UndoRedo/UndoRedo.svelte';
  import Toolbar from './ui/Toolbar/Toolbar.svelte';

  import { COLORS, CURSORS, type CanvasContextType, type RenderManager } from './lib';

  let canvasComponent: Canvas;
  let context: CanvasContextType | null;
  let renderManager: RenderManager;

  let dragStartPosition = { x: 0, y: 0 };
  let currentTransformedCursor = { x: 0, y: 0 };
  let useLayerEvents = false;
  let isDragging = false;
  let colors = [COLORS.STICKER_YELLOW, COLORS.STICKER_DARK_GREEN, COLORS.STICKER_PINK];

  onMount(() => {
    context = canvasComponent.getCanvasContext();
    renderManager = canvasComponent.getRenderManager();
  });

  const sort = (color: string) => (colors = colors.sort((a, b) => (a === color ? 1 : b === color ? -1 : 0)));

  const getTransformedPoint = (x: number, y: number) => {
    const originalPoint = new DOMPoint(x, y);
    return context!.getTransform().invertSelf().transformPoint(originalPoint);
  };

  const onMouseDown = (e: MouseEvent) => {
    if (useLayerEvents) return;
    isDragging = true;
    dragStartPosition = getTransformedPoint(e.pageX, e.pageY);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || useLayerEvents) return;
    currentTransformedCursor = getTransformedPoint(e.pageX, e.pageY);

    context!.translate(
      currentTransformedCursor.x - dragStartPosition.x,
      currentTransformedCursor.y - dragStartPosition.y,
    );

    renderManager.redraw();
  };

  const onMouseUp = () => {
    if (useLayerEvents) return;
    isDragging = false;
  };

  const onWheel = (e: WheelEvent) => {
    if (useLayerEvents) return;
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;

    context!.translate(currentTransformedCursor.x, currentTransformedCursor.y);
    context!.scale(zoom, zoom);
    context!.translate(-currentTransformedCursor.x, -currentTransformedCursor.y);

    renderManager.redraw();
    e.preventDefault();
  };
</script>

<main>
  <Toolbar />
  <Canvas
    {useLayerEvents}
    width={window.innerWidth}
    height={window.innerHeight}
    style={useLayerEvents ? '' : `cursor: ${CURSORS.HAND}`}
    bind:this={canvasComponent}
    on:mousedown={onMouseDown}
    on:mousemove={onMouseMove}
    on:mouseup={onMouseUp}
    on:wheel={onWheel}
  >
    <Background />
    {#each colors as color, i (color)}
      {@const c = (i + 1) * 85}
      <ResizableLayer
        initialBounds={{ x0: c, y0: c, x1: c + 180, y1: c + 180 }}
        on:mousedown={() => sort(color)}
        on:touchstart={() => sort(color)}
        let:bounds
      >
        <Layer
          render={({ context }) => {
            const { x0, y0, x1, y1 } = bounds;
            context.globalAlpha = 0.9;
            context.fillStyle = color;
            context.fillRect(x0, y0, x1 - x0, y1 - y0);
            context.globalAlpha = 1;
          }}
        />
      </ResizableLayer>
    {/each}
  </Canvas>
  <UndoRedo />
  <Zoom />
</main>
