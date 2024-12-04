<script lang="ts">
  import { onMount } from 'svelte';

  import type { Point } from 'core/interfaces';
  import { geometryManager, type Viewport } from 'core/services';
  import { dndWatcher } from 'core/lib';
  import { Canvas, Layer } from 'core/ui';

  import { Tools, type DoubleClickData } from 'client/shared/interfaces';
  import { CURSORS } from 'client/shared/constants';

  import Zoom from 'client/ui/Zoom/Zoom.svelte';
  import Background from 'client/ui/Background/Background.svelte';
  import Selection from 'client/ui/Selection/Selection.svelte';
  import Toolbar from 'client/ui/Toolbar/Toolbar.svelte';
  import Connection from 'client/ui/Connection/Connection.svelte';
  import TextEditor from 'client/ui/TextEditor/TextEditor.svelte';
  import ResizableLayer from 'client/ui/ResizableLayer/ResizableLayer.svelte';
  import type { ResizableLayerEventDetails } from 'client/ui/ResizableLayer/interfaces';

  import { canvasStore } from 'client/ui/Canvas/store';
  import { toolbarStore } from 'client/ui/Toolbar/store';
  import { connectionStore } from 'client/ui/Connection/store';

  import './App.css';

  let canvas: Canvas;
  let viewport: Viewport;
  let selection: Point[] = [];
  let isLayerEntered = false;
  let isLayerEditable = false;
  let clickOutsideExcluded: string[] = ['trash', 'text-editor-menu', 'text-editor-menu-dropdown'];
  let textEditorCoordinates: DoubleClickData = { x: 0, y: 0, layerWidth: 0, layerHeight: 0 };

  const { tool } = toolbarStore;
  const { shapes, selectionPath } = canvasStore;
  const { currentConnection, connections } = connectionStore;

  $: connection = $tool === Tools.CONNECT;
  $: panning = $tool === Tools.PAN;
  $: cursorStyle = panning ? `cursor: ${CURSORS.HAND}` : ``;
  $: selection = $selectionPath.length > 0 ? $selectionPath : selection;

  onMount(async () => {
    viewport = canvas.getViewport();

    const ref = canvas.getCanvasElement();
    const rect = ref.getBoundingClientRect();
    const selectionWatcher = dndWatcher(ref);

    for await (const e of selectionWatcher) {
      canvasStore.dragSelection(<MouseEvent>e, rect);
    }
  });

  const handleCanvasClick = (e: MouseEvent) => {
    canvasStore.addShape(e);
    selection = $selectionPath;
    isLayerEditable = false;
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
    isLayerEditable = false;
    isLayerEntered = false;
  };

  const handleLayerTouch = (e: CustomEvent<ResizableLayerEventDetails>, uuid: string) => {
    connectionStore.handleBoxSelect(e, uuid);
  };

  const handleLayerMove = (e: CustomEvent<ResizableLayerEventDetails>, uuid: string) => {
    connectionStore.handleBoxMove(e, uuid);
  };

  const handleLayerEnter = (e: CustomEvent<ResizableLayerEventDetails>, uuid: string) => {
    isLayerEntered = true;
    connectionStore.handleBoxEnter(e, uuid);
  };

  const handleLayerDoubleClick = (e: CustomEvent<ResizableLayerEventDetails>) => {
    if (!e.detail) return;

    const { data, bounds } = e.detail;
    const rect = geometryManager.getRectDimensionFromBounds(bounds);

    if (!rect) return;

    isLayerEditable = true;

    textEditorCoordinates = {
      ...viewport.onLayerDoubleClick(data!, bounds),
      layerWidth: rect.width,
      layerHeight: rect.height,
    };
  };
</script>

<main>
  <Toolbar />
  {#if isLayerEditable}
    <TextEditor position={textEditorCoordinates} />
  {/if}
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
      <Connection source={$currentConnection?.source} target={$currentConnection?.target} />
    {/if}
    {#each Object.entries($connections) as [connectionId, { source, target }]}
      <Connection {connectionId} {source} {target} selectOnMakingConnection={connection} />
    {/each}
    {#each $shapes.values() as { uuid, initialBounds, isSelected, ...rest } (uuid)}
      <ResizableLayer
        {initialBounds}
        {isSelected}
        selectionPath={selection}
        selectOnMakingConnection={connection}
        isMovingBlocked={connection}
        on:mousedown={handleLayerMouseDown}
        on:layer.dblclick={handleLayerDoubleClick}
        on:layer.active={() => handleLayerActive(uuid)}
        on:layer.leave={() => handleLayerLeave(uuid)}
        on:layer.touch={(e) => handleLayerTouch(e, uuid)}
        on:layer.move={(e) => handleLayerMove(e, uuid)}
        on:layer.enter={(e) => handleLayerEnter(e, uuid)}
        let:bounds
      >
        <Layer
          {bounds}
          render={({ drawer }) => {
            const { x0, y0, x1, y1 } = bounds;
            drawer.fillRect({
              x: x0,
              y: y0,
              width: x1 - x0,
              height: y1 - y0,
              ...rest,
            });
          }}
        />
      </ResizableLayer>
    {/each}
  </Canvas>
  <Zoom />
</main>
