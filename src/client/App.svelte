<script lang="ts">
  import { onMount, type ComponentType } from 'svelte';

  import type { Point } from 'core/interfaces';
  import { type Camera } from 'core/services';
  import { dndWatcher } from 'core/lib';
  import { Canvas } from 'core/ui';

  import { Tools } from 'client/shared/interfaces';
  import { CURSORS } from 'client/shared/constants';

  import When from 'client/ui/When/When.svelte';
  import Zoom from 'client/ui/Zoom/Zoom.svelte';
  import Keyboard from 'client/ui/Keyboard/Keyboard.svelte';
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

  import 'client/shared/styles/_global.css';

  let canvas: Canvas;
  let camera: Camera;
  let selection: Point[] = [];
  let isLayerEntered = false;

  const { tool } = toolbarStore;
  const { shapes, selectionPath, textEditor, clickOutsideExcludedIds, isSelected } = canvasStore;
  const { currentConnection, connections } = connectionStore;

  $: connection = $tool === Tools.CONNECT;
  $: panning = $tool === Tools.PAN;
  $: cursorStyle = panning ? `cursor: ${CURSORS.HAND}` : ``;
  $: selection = $selectionPath.length > 0 ? $selectionPath : selection;

  onMount(async () => {
    camera = canvas.getCamera();

    const ref = canvas.getCanvasElement();
    const rect = ref.getBoundingClientRect();
    const selectionWatcher = dndWatcher(ref);

    for await (const e of selectionWatcher) {
      const transformedPoint = camera.handleCanvasClick(<MouseEvent>e);
      canvasStore.dragSelection(<MouseEvent>e, rect, transformedPoint);
    }
  });

  const handleCanvasClick = (e: MouseEvent) => {
    if ($isSelected) return;
    const transformedPoint = camera.handleCanvasClick(e);

    canvasStore.addShape(e, transformedPoint);
    selection = $selectionPath;
    canvasStore.resetSelection();
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (!panning) return;
    camera.handleMouseDown(e);
  };

  const handleCanvasMouseUp = (e: MouseEvent) => {
    if (!panning) return;
    camera.handleMouseUp(e);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if ($textEditor) return;
    camera.handleMouseMove(e);
    if (isLayerEntered) return;
    const transformedPoint = camera.handleCanvasClick(e);
    connectionStore.handleCanvasMouseMove(transformedPoint);
  };

  const handleCanvasWheel = (e: WheelEvent) => {
    if ($textEditor) return;
    camera.handleWheelChange(e);
  };

  const handleLayerMouseDown = () => {
    canvasStore.setIsSelected(true);
  };

  const handleLayerActive = (e: CustomEvent<ResizableLayerEventDetails>) => {
    if (!e.detail) return;
    canvasStore.selectShape(e.detail.entityId);
  };

  const handleLayerLeave = (e: CustomEvent<ResizableLayerEventDetails>) => {
    if (!e.detail) return;
    canvasStore.deselectShape(e.detail.entityId);
    canvasStore.setIsSelected(false);
    canvasStore.saveText();
    isLayerEntered = false;
  };

  const handleLayerTouch = (e: CustomEvent<ResizableLayerEventDetails>) => {
    if (!e.detail) return;
    connectionStore.handleBoxSelect(e, e.detail.entityId);
  };

  const handleLayerMove = (e: CustomEvent<ResizableLayerEventDetails>) => {
    if (!e.detail) return;
    connectionStore.handleBoxMove(e, e.detail.entityId);
  };

  const handleLayerEnter = (e: CustomEvent<ResizableLayerEventDetails>) => {
    if (!e.detail) return;
    isLayerEntered = true;
    connectionStore.handleBoxEnter(e, e.detail.entityId);
  };

  const handleLayerDoubleClick = (e: CustomEvent<ResizableLayerEventDetails>) => {
    if (connection || !e.detail?.data) return;
    const { entityId, data, bounds } = e.detail;
    const transformedPoint = camera.handleLayerDoubleClick(data, bounds);
    canvasStore.initTextEditor(entityId, transformedPoint);
  };
</script>

<main>
  <Toolbar />
  <Zoom />
  <Keyboard />
  <When isVisible={Boolean($textEditor?.isEditable)}>
    <TextEditor
      anchorId={$textEditor?.anchorId}
      position={$textEditor?.position}
      transform={camera?.renderer?.getTransform()}
    />
  </When>
  <Canvas
    useLayerEvents={!panning}
    handleEventsOnLayerMove={connection}
    {clickOutsideExcludedIds}
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
    <Background />
    <When isVisible={$tool === Tools.SELECT}>
      <Selection path={$selectionPath} />
    </When>
    <When isVisible={connection && Boolean($currentConnection)}>
      <Connection source={$currentConnection?.source} target={$currentConnection?.target} />
    </When>
    {#each $connections.entries() as [connectionId, { source, target }] (connectionId)}
      <Connection {connectionId} {source} {target} selectOnMakingConnection={connection} />
    {/each}
    {#each $shapes.values() as shape (shape.id)}
      <ResizableLayer
        entityId={shape.id}
        initialBounds={shape.getBounds()}
        isSelected={shape.isSelected}
        selectionPath={selection}
        selectOnMakingConnection={connection}
        isMovingBlocked={connection}
        on:mousedown={handleLayerMouseDown}
        on:layer.enter={handleLayerEnter}
        on:layer.touch={handleLayerTouch}
        on:layer.dblclick={handleLayerDoubleClick}
        on:layer.active={handleLayerActive}
        on:layer.leave={handleLayerLeave}
        on:layer.move={handleLayerMove}
      />
    {/each}
  </Canvas>
</main>
