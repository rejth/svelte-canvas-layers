<script lang="ts">
  import { onMount } from 'svelte';

  import { dndWatcher } from 'core/lib';
  import { Canvas, Layer, ResizableLayer } from 'core/ui';
  import { geometryManager, type Viewport } from 'core/services';

  import { Tools, type ShapeConfig } from 'client/interfaces';
  import { CURSORS } from 'client/constants';

  import Zoom from 'client/ui/Zoom/Zoom.svelte';
  import Background from 'client/ui/Background/Background.svelte';
  import Selection from 'client/ui/Selection/Selection.svelte';
  import UndoRedo from 'client/ui/UndoRedo/UndoRedo.svelte';
  import Toolbar from 'client/ui/Toolbar/Toolbar.svelte';
  import { canvasStore } from './ui/Canvas/store';
  import { toolbarStore } from './ui/Toolbar/store';

  import './App.css';

  let canvasComponent: Canvas;
  let viewport: Viewport;

  onMount(() => {
    viewport = canvasComponent.getViewport();
  });

  onMount(async () => {
    const canvasRef = canvasComponent.getCanvasElement();
    const rect = canvasRef.getBoundingClientRect();
    const selection = dndWatcher(canvasRef);

    for await (const e of selection) {
      canvasStore.dragSelection(<MouseEvent>e, rect);
    }
  });

  const { tool } = toolbarStore;
  const { shapes, selection } = canvasStore;

  $: useLayerEvents = $tool !== Tools.PAN;
  $: cursorStyle = useLayerEvents ? '' : `cursor: ${CURSORS.HAND}`;
  $: overlappedBounds = geometryManager.getPathBounds($selection);

  const onClick = (e: MouseEvent) => {
    canvasStore.addShape(e);
    canvasStore.resetSelection();
  };

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

  const handleActiveLayer = (uuid: ShapeConfig['uuid'], isSelected: boolean) => {
    if (isSelected) {
      canvasStore.selectShape(uuid);
    } else {
      canvasStore.deselectShape(uuid);
    }
  };
</script>

<main>
  <Toolbar />
  <Canvas
    {useLayerEvents}
    width={window.innerWidth}
    height={window.innerHeight}
    style={cursorStyle}
    bind:this={canvasComponent}
    on:click={onClick}
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
    {#if $tool === Tools.SELECT}
      <Selection path={$selection} />
    {/if}
    {#each [...$shapes.values()] as { uuid, bounds, color, selected } (uuid)}
      <ResizableLayer
        initialBounds={bounds}
        {overlappedBounds}
        onActiveChange={(isSelected) => handleActiveLayer(uuid, isSelected)}
        on:mousedown={() => canvasStore.selectShape(uuid)}
        let:bounds
      >
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
