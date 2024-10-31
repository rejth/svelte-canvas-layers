<script lang="ts">
  import { onMount } from 'svelte';

  import type { Point } from 'core/interfaces';
  import { type Viewport } from 'core/services';
  import { dndWatcher } from 'core/lib';
  import { Canvas, Layer, ResizableLayer, type LayerEventDetails } from 'core/ui';

  import { Tools } from 'client/interfaces';
  import { CURSORS } from 'client/constants';

  import Zoom from 'client/ui/Zoom/Zoom.svelte';
  import Background from 'client/ui/Background/Background.svelte';
  import Selection from 'client/ui/Selection/Selection.svelte';
  import UndoRedo from 'client/ui/UndoRedo/UndoRedo.svelte';
  import Toolbar from 'client/ui/Toolbar/Toolbar.svelte';
  import Connection from './ui/Connection/Connection.svelte';
  import { canvasStore } from './ui/Canvas/store';
  import { toolbarStore } from './ui/Toolbar/store';
  import { connectionStore } from './ui/Connection/store';

  import './App.css';

  let canvas: Canvas;
  let viewport: Viewport;
  let selection: Point[] = [];
  let isLayerEntered = false;
  let clickOutsideExcluded: HTMLElement[] = [];

  const { tool } = toolbarStore;
  const { shapes, selectionPath } = canvasStore;
  const { currentConnection, connections } = connectionStore;

  // TODO:
  // [x] EASY: disable mousemove and touchmove events when the tool is "CONNECT"
  // [x] EASY: avoid geometryManager.getRectDimensionFromBounds(bounds) in the ResizableLayer component

  // [x] MEDIUM: draw an arrow at the end of a connection
  // [x] MEDIUM: handle connection on selected shape properly (reset selection when toolbar is clicked)

  // [ ] HARD: implement connection deletion via Trash button in toolbar
  // [x] HARD: select (see ourboard.io) shape on hovering during connection
  // [x] HARD: connect (see ourboard.io) arrow with a box when hovering
  // [x] HARD: reset selection when toolbar is clicked

  onMount(async () => {
    viewport = canvas.getViewport();

    const ref = canvas.getCanvasElement();
    const rect = ref.getBoundingClientRect();
    const selectionWatcher = dndWatcher(ref);
    const trashIcon = document.getElementById('trash');

    if (trashIcon) {
      clickOutsideExcluded = [trashIcon];
    }

    for await (const e of selectionWatcher) {
      canvasStore.dragSelection(<MouseEvent>e, rect);
    }
  });

  $: connection = $tool === Tools.CONNECT;
  $: panning = $tool === Tools.PAN;
  $: cursorStyle = panning ? `cursor: ${CURSORS.HAND}` : ``;
  $: selection = $selectionPath.length > 0 ? $selectionPath : selection;

  const handleCanvasClick = (e: MouseEvent) => {
    canvasStore.addShape(e);
    selection = $selectionPath;
    canvasStore.resetSelection();
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (!panning) return;
    viewport.onMouseDown(e);
  };

  const handleCanvasMouseUp = (e: MouseEvent) => {
    if (!panning) return;
    viewport.onMouseUp(e);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    viewport.onMouseMove(e);
    if (isLayerEntered) return;
    connectionStore.handleCanvasMouseMove(e);
  };

  const handleCanvasWheel = (e: WheelEvent) => {
    viewport.onWheel(e);
  };

  const handleLayerMouseDown = () => {
    canvasStore.setIsSelected(true);
  };

  const handleLayerActive = (uuid: string) => {
    canvasStore.selectShape(uuid);
  };

  const handleLayerLeave = (uuid: string) => {
    canvasStore.deselectShape(uuid);
    canvasStore.setIsSelected(false);
    isLayerEntered = false;
  };

  const handleLayerTouch = (e: CustomEvent<LayerEventDetails>, uuid: string) => {
    connectionStore.handleBoxSelect(e, uuid);
  };

  const handleLayerMove = (e: CustomEvent<LayerEventDetails>, uuid: string) => {
    connectionStore.handleBoxMove(e, uuid);
  };

  const handleLayerEnter = (e: CustomEvent<LayerEventDetails>, uuid: string) => {
    isLayerEntered = true;
    connectionStore.handleBoxEnter(e, uuid);
  };
</script>

<main>
  <Toolbar />
  <Canvas
    useLayerEvents={!panning}
    handleEventsOnLayerMove={connection}
    {clickOutsideExcluded}
    width={window.innerWidth}
    height={window.innerHeight}
    style={cursorStyle}
    bind:this={canvas}
    on:outclick={() => (selection = [])}
    on:click={handleCanvasClick}
    on:mousedown={handleCanvasMouseDown}
    on:mousemove={handleCanvasMouseMove}
    on:mouseup={handleCanvasMouseUp}
    on:wheel={handleCanvasWheel}
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
      <Selection path={$selectionPath} />
    {/if}
    {#if connection && $currentConnection}
      <Connection boxA={$currentConnection?.source?.box} boxB={$currentConnection?.target?.box} />
    {/if}
    {#each Object.values($connections) as { source, target }}
      <Connection boxA={source.box} boxB={target.box} />
    {/each}
    {#each $shapes.values() as { uuid, initialBounds, color, isSelected } (uuid)}
      <ResizableLayer
        {initialBounds}
        {isSelected}
        selectionPath={selection}
        selectOnMakingConnection={connection}
        isMovingBlocked={connection}
        on:mousedown={handleLayerMouseDown}
        on:layer.active={() => handleLayerActive(uuid)}
        on:layer.leave={() => handleLayerLeave(uuid)}
        on:layer.touch={(e) => handleLayerTouch(e, uuid)}
        on:layer.move={(e) => handleLayerMove(e, uuid)}
        on:layer.enter={(e) => handleLayerEnter(e, uuid)}
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
