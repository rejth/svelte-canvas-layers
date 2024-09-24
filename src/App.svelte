<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';

  import Canvas from './ui/Canvas.svelte';
  import ResizableLayer from './ui/ResizableLayer/ResizableLayer.svelte';
  import Layer from './ui/Layer.svelte';
  import Background from './ui/BackgroundLayer/Background.svelte';
  import Zoom from './ui/Zoom/Zoom.svelte';
  import UndoRedo from './ui/UndoRedo/UndoRedo.svelte';
  import Toolbar from './ui/Toolbar/Toolbar.svelte';

  import { COLORS_ARRAY, CURSORS, type CanvasContextType, type Point, type RenderManager } from './lib';
  import type { Renderer } from './lib/Renderer';
  import { toolbarStore } from './ui/Toolbar/store';
  import { Tools } from './ui/Toolbar/types';

  const { tool } = toolbarStore;
  $: useLayerEvents = $tool === Tools.SELECT;

  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  let canvasComponent: Canvas;
  let context: CanvasContextType | null;
  let renderManager: RenderManager;
  let renderer: Renderer;
  let colors = new Array(1).fill(null).map(() => ({ id: uuid(), value: COLORS_ARRAY[random(0, 10)] }));

  // Panning
  let dragStartPosition: Point = { x: 0, y: 0 };
  let currentTransformedCursor: Point = { x: 0, y: 0 };
  let isDragging = false;

  // Zooming
  let startPosition: Point | null = null;
  let currentPosition: Point = { x: 0, y: 0 };

  onMount(() => {
    renderManager = canvasComponent.getRenderManager();
    renderer = renderManager.getRenderer();
    context = renderManager.getContext();
  });

  const sort = (color: string) =>
    (colors = colors.sort((a, b) => (a.value === color ? 1 : b.value === color ? -1 : 0)));

  const onMouseDown = (e: MouseEvent) => {
    if (useLayerEvents) return;
    isDragging = true;
    dragStartPosition = renderer.getTransformedPoint(e.pageX, e.pageY);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (useLayerEvents || !context || !isDragging) return;
    currentTransformedCursor = renderer.getTransformedPoint(e.pageX, e.pageY);

    context.translate(
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
    if (useLayerEvents || !context) return;

    if (!startPosition) {
      dragStartPosition = renderer.getTransformedPoint(e.pageX, e.pageY);
      currentPosition = { x: e.pageX, y: e.pageY };
    }

    if (e.ctrlKey) {
      currentPosition = {
        x: currentPosition.x + e.deltaX * -1,
        y: currentPosition.y + e.deltaY * -1,
      };

      currentTransformedCursor = renderer.getTransformedPoint(e.clientX, e.clientY);

      const zoom = e.deltaY < 0 ? 1.1 : 0.9;
      const transform = renderer.getTransform();
      const nextZoomPercentage = renderer.canvasScaleToPercentage(transform.scaleX * zoom);
      const scale = renderer.zoomPercentageToScale(nextZoomPercentage) / transform.scaleX;

      if (nextZoomPercentage <= 200 && nextZoomPercentage >= 10) {
        context.translate(currentTransformedCursor.x, currentTransformedCursor.y);
        renderer.scale(scale, scale);
        context.translate(-currentTransformedCursor.x, -currentTransformedCursor.y);
        renderManager.redraw();
      }
    } else {
      currentPosition = {
        x: currentPosition.x + e.deltaX * -1,
        y: currentPosition.y + e.deltaY * -1,
      };

      currentTransformedCursor = renderer.getTransformedPoint(currentPosition.x, currentPosition.y);
      context.translate(
        currentTransformedCursor.x - dragStartPosition.x,
        currentTransformedCursor.y - dragStartPosition.y,
      );

      renderManager.redraw();
    }
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
    {#each colors as { id, value }, i (id)}
      {@const c = (i + 1) * 85}
      <ResizableLayer initialBounds={{ x0: c, y0: c, x1: c + 338, y1: c + 338 }} let:bounds>
        <Layer
          render={({ context }) => {
            const { x0, y0, x1, y1 } = bounds;
            context.globalAlpha = 0.9;
            context.fillStyle = value;
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
