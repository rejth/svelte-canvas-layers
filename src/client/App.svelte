<script lang="ts">
  import { onMount, type ComponentType } from 'svelte';

  import type { Point } from 'core/interfaces';
  import { geometryManager, type Viewport } from 'core/services';
  import { dndWatcher } from 'core/lib';
  import { Canvas } from 'core/ui';

  import { Tools, type DoubleClickData } from 'client/shared/interfaces';
  import { CURSORS } from 'client/shared/constants';
  import { CanvasEntityType } from 'client/ui/Canvas/BaseCanvasEntity';
  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';

  import When from 'client/ui/When/When.svelte';
  import Rect from 'client/ui/Canvas/Rect.svelte';
  import Text from 'client/ui/Canvas/Text.svelte';
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

  import 'client/shared/styles/_global.css';

  const widgets: Partial<Record<CanvasEntityType, ComponentType>> = {
    [CanvasEntityType.RECT]: Rect,
    [CanvasEntityType.TEXT]: Text,
  };

  let canvas: Canvas;
  let viewport: Viewport;
  let selection: Point[] = [];
  let isLayerEntered = false;
  let clickOutsideExcluded: string[] = ['trash', 'text-editor-menu', 'text-editor-menu-dropdown'];
  let entityData: DoubleClickData = { entityId: '', x: 0, y: 0, layerWidth: 0, layerHeight: 0 };

  const { tool } = toolbarStore;
  const { shapes, selectionPath, textEditor } = canvasStore;
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
    canvasStore.resetSelection();
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (!panning) return;
    viewport.handleMouseDown(e);
  };

  const handleCanvasMouseUp = (e: MouseEvent) => {
    if (!panning) return;
    viewport.handleMouseUp(e);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    viewport.handleMouseMove(e);
    if (isLayerEntered) return;
    connectionStore.handleCanvasMouseMove(e);
  };

  const handleCanvasWheel = (e: WheelEvent) => {
    viewport.handleWheelChange(e);
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
    if (!e.detail) return;

    const { entityId, data, bounds } = e.detail;
    const rect = geometryManager.getRectDimensionFromBounds(bounds);

    if (!rect) return;

    const rectOptions = $shapes.get(entityId)?.getOptions() as RectDrawOptions;
    const textOptions = rectOptions?.editor?.getOptions();
    const doubleClickData = viewport.handleLayerDoubleClick(data!, bounds);

    canvasStore.updateTextEditor({
      anchorId: entityId,
      text: textOptions?.text || '',
      fontSize: textOptions?.fontSize,
      textAlign: textOptions?.textAlign,
      bold: Boolean(/bold/.test(textOptions?.fontStyle || '')),
      italic: Boolean(/italic/.test(textOptions?.fontStyle || '')),
      isEditable: true,
    });

    entityData = {
      entityId,
      layerWidth: rect.width,
      layerHeight: rect.height,
      ...doubleClickData,
    };
  };
</script>

<main>
  <Toolbar />
  <When isVisible={Boolean($textEditor?.isEditable)}>
    <TextEditor anchorData={entityData} />
  </When>
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
    <Background />
    <When isVisible={$tool === Tools.SELECT}>
      <Selection path={$selectionPath} />
    </When>
    <When isVisible={connection && Boolean($currentConnection)}>
      <Connection source={$currentConnection?.source} target={$currentConnection?.target} />
    </When>
    {#each $connections.entries() as [connectionId, { source, target }]}
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
        let:bounds
      >
        <svelte:component this={widgets[shape.getType()]} entityId={shape.id} {bounds} />
      </ResizableLayer>
    {/each}
  </Canvas>
  <Zoom />
</main>
