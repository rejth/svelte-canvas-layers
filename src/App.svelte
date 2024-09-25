<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuid } from 'uuid';

  import Canvas from 'ui/Canvas.svelte';
  import Layer from 'ui/Layer.svelte';
  import Zoom from 'ui/Zoom/Zoom.svelte';
  import UndoRedo from 'ui/UndoRedo/UndoRedo.svelte';
  import Toolbar from 'ui/Toolbar/Toolbar.svelte';
  import ResizableLayer from 'ui/ResizableLayer/ResizableLayer.svelte';
  import BackgroundPatternLayer from 'ui/BackgroundLayer/BackgroundPatternLayer.svelte';
  import { Tools } from 'ui/Toolbar/types';
  import { toolbarStore } from 'ui/Toolbar/store';

  import { COLORS_ARRAY, CURSORS } from 'lib/constants';
  import { Viewport } from 'lib/Viewport';

  const { tool } = toolbarStore;
  $: useLayerEvents = $tool === Tools.SELECT;

  let viewport: Viewport;
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  let canvasComponent: Canvas;
  let colors = new Array(1)
    .fill(null)
    .map(() => ({ id: uuid(), value: COLORS_ARRAY[random(0, 10)] }));

  onMount(() => {
    viewport = canvasComponent.getViewport();
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
    <BackgroundPatternLayer
      width={10}
      height={10}
      render={({ context }) => {
        context.beginPath();
        context.fillStyle = '#d2d6db';
        context.arc(1, 1, 0.5, 0, 2 * Math.PI);
        context.fill();
      }}
    />
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
