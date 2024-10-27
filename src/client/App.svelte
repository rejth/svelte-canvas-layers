<script lang="ts">
  import { onMount } from 'svelte';

  import type { Point, RectDimension } from 'core/interfaces';
  import { type Viewport } from 'core/services';
  import { dndWatcher } from 'core/lib';
  import { Canvas, Layer, ResizableLayer } from 'core/ui';

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

  const { tool } = toolbarStore;
  const { shapes, selectionPath } = canvasStore;
  const { currentConnection, connections } = connectionStore;

  // TODO:
  // [ ] EASY: disable mousemove and touchmove events when the tool is "CONNECT"
  // [ ] EASY: avoid geometryManager.getRectDimensionFromBounds(bounds) in the ResizableLayer component

  // [ ] MEDIUM: implement connection deletion via Trash button in toolbar
  // [ ] MEDIUM: handle connection on selected shape properly (reset selection when toolbar is clicked)

  // [ ] HARD: draw an arrow at the end of a connection
  // [ ] HARD: select (see ourboard.io) shape on hovering during connection
  // [ ] HARD: connect (see ourboard.io) arrow with a box when hovering

  onMount(async () => {
    viewport = canvas.getViewport();

    const ref = canvas.getCanvasElement();
    const rect = ref.getBoundingClientRect();
    const selectionWatcher = dndWatcher(ref);

    for await (const e of selectionWatcher) {
      canvasStore.dragSelection(<MouseEvent>e, rect);
    }
  });

  $: panning = $tool === Tools.PAN;
  $: cursorStyle = panning ? `cursor: ${CURSORS.HAND}` : ``;
  $: selection = $selectionPath.length > 0 ? $selectionPath : selection;

  const onClick = (e: MouseEvent) => {
    canvasStore.addShape(e);
    selection = $selectionPath;
    canvasStore.resetSelection();
  };

  const onMouseDown = (e: MouseEvent) => {
    if (!panning) return;
    viewport.onMouseDown(e);
  };

  const onMouseUp = (e: MouseEvent) => {
    if (!panning) return;
    viewport.onMouseUp(e);
  };

  const onMouseMove = (e: MouseEvent) => {
    viewport.onMouseMove(e);
    connectionStore.handleMouseMove(e);
  };

  const onWheel = (e: WheelEvent) => {
    viewport.onWheel(e);
  };

  const handleLayerMouseDown = () => {
    canvasStore.setIsSelected(true);
  };

  const handleLayerActive = (e: CustomEvent<{ box: RectDimension }>, id: string) => {
    canvasStore.selectShape(id);
    connectionStore.handleBoxSelect(e, id);
  };

  const handleLayerLeave = (uuid: string) => {
    canvasStore.deselectShape(uuid);
    canvasStore.setIsSelected(false);
  };

  const handleLayerMove = (e: CustomEvent<{ box: RectDimension }>, id: string) => {
    connectionStore.handleBoxMove(e, id);
  };
</script>

<main>
  <Toolbar />
  <Canvas
    useLayerEvents={!panning}
    width={window.innerWidth}
    height={window.innerHeight}
    style={cursorStyle}
    bind:this={canvas}
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
      <Selection path={$selectionPath} />
    {/if}
    {#if $tool === Tools.CONNECT && $currentConnection}
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
        on:mousedown={handleLayerMouseDown}
        on:move={(e) => handleLayerMove(e, uuid)}
        on:active={(e) => handleLayerActive(e, uuid)}
        on:leave={() => handleLayerLeave(uuid)}
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
