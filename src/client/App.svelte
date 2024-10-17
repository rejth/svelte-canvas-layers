<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';

  import {
    Canvas,
    Layer,
    ResizableLayer,
    TextTransformationLayer,
    type Viewport,
  } from 'core/index';

  import { Tools } from 'client/interfaces';
  import { COLORS, CURSORS } from 'client/constants';
  import { Zoom, UndoRedo, Background, Demo, Toolbar, toolbarStore } from 'client/ui';

  import './App.css';

  let canvasComponent: Canvas;
  let viewport: Viewport;

  onMount(() => {
    viewport = canvasComponent.getViewport();
  });

  const { tool } = toolbarStore;
  $: useLayerEvents = $tool === Tools.SELECT;

  let visibleLayers = new Array(3).fill(null).map((_, i) => {
    const minPos = (i + 1) * 85;
    const maxPos = minPos + 338;
    return {
      id: uuid(),
      color: COLORS.STICKER_YELLOW,
      initialBounds: { x0: minPos, y0: minPos, x1: maxPos, y1: maxPos },
    };
  });

  let inVisibleLayers = new Array(3).fill(null).map((_, i) => {
    const minPos = (i + 1) * 985;
    const maxPos = minPos + 338;
    return {
      id: uuid(),
      color: COLORS.STICKER_DARK_GREEN,
      initialBounds: { x0: minPos, y0: minPos, x1: maxPos, y1: maxPos },
    };
  });

  const onMouseDown = (e: MouseEvent) => {
    if (useLayerEvents) return;
    viewport.onMouseDown(e);
  };

  const onMouseUp = (e: MouseEvent) => {
    if (useLayerEvents) return;
    viewport.onMouseUp(e);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (useLayerEvents) return;
    viewport.onMouseMove(e);
  };

  const onWheel = (e: WheelEvent) => {
    if (useLayerEvents) return;
    viewport.onWheel(e);
  };
</script>

<main>
  <Toolbar />
  <!-- <Demo /> -->
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
    <Background
      width={10}
      height={10}
      render={({ context }) => {
        context.beginPath();
        context.fillStyle = '#d2d6db';
        context.arc(1, 1, 0.5, 0, 2 * Math.PI);
        context.fill();
      }}
    />
    <!-- <TextTransformationLayer text="Hello World!" /> -->
    {#each visibleLayers as { id, color, initialBounds }, i (id)}
      <ResizableLayer {initialBounds} let:bounds>
        <Layer
          {bounds}
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
    {#each inVisibleLayers as { id, color, initialBounds }, i (id)}
      <ResizableLayer {initialBounds} let:bounds>
        <Layer
          {bounds}
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
