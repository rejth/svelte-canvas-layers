<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { Point, Bounds, LayerEventDetails } from 'core/interfaces';
  import { geometryManager } from 'core/services';

  import { canvasStore } from 'client/ui/Canvas/store';

  import Surface from './ResizableLayerSurface.svelte';
  import Handler from './ResizableLayerHandler.svelte';
  import { ResizableLayerEvent, type ResizableLayerEventDispatcher } from './interfaces';

  // TODO: Get rid of the bounds, use { x, y, width, height } instead
  export let entityId: string;
  export let initialBounds: Bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };
  export let selectionPath: Point[] = [];
  export let isSelected: boolean = false;
  export let selectOnMakingConnection: boolean = false;
  export let isMovingBlocked: boolean = false;

  const dispatcher = createEventDispatcher<ResizableLayerEventDispatcher>();

  const [N, S, W, E] = [1, 2, 4, 8];
  const HANDLERS = [N, S, W, E, N | W, N | E, S | W, S | E];
  const SURFACE = N | S | W | E;

  let { x0, y0, x1, y1 } = initialBounds;
  let draggedHandler: number | null = null;
  let hoveredHandler: number | null = null;
  let previousTouch: Touch;

  $: bounds = { x0, y0, x1, y1 };
  $: active = Boolean(draggedHandler || hoveredHandler) || isOverlapped(selectionPath);
  $: selected = active || isSelected;

  $: active && dispatcher(ResizableLayerEvent.ACTIVE, { entityId, bounds });
  $: !active && dispatcher(ResizableLayerEvent.LEAVE, { entityId, bounds });

  $: sortedHandlers = HANDLERS.sort((a, b) =>
    a === hoveredHandler ? 1 : b === hoveredHandler ? -1 : 0,
  );

  $: getHandlerPosition = (handler: number): Point => {
    return {
      x: handler & W ? x0 - 5 : handler & E ? x1 + 5 : geometryManager.getMiddlePoint(x0, x1),
      y: handler & N ? y0 - 5 : handler & S ? y1 + 5 : geometryManager.getMiddlePoint(y0, y1),
    };
  };

  // TODO: Handle cursor type change on "mouseover" event
  $: handlerCursor = (handler: number | null): string => {
    if (handler === SURFACE) return 'pointer';

    if (handler === (N | W) || handler === (S | E)) {
      return 'nwse-resize';
    } else if (handler === (N | E) || handler === (S | W)) {
      return 'nesw-resize';
    } else if (handler === N || handler === S) {
      return 'ns-resize';
    } else if (handler === W || handler === E) {
      return 'ew-resize';
    }

    return 'auto';
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!draggedHandler || isMovingBlocked) return;
    const { movementX, movementY } = e;
    x0 += draggedHandler & W && movementX;
    y0 += draggedHandler & N && movementY;
    x1 += draggedHandler & E && movementX;
    y1 += draggedHandler & S && movementY;
    dispatcher(ResizableLayerEvent.MOVE, { entityId, bounds });
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!draggedHandler || isMovingBlocked) return;
    const { clientX, clientY } = e.touches[0];
    const movementX = clientX - previousTouch.clientX;
    const movementY = clientY - previousTouch.clientY;
    x0 += draggedHandler & W && movementX;
    y0 += draggedHandler & N && movementY;
    x1 += draggedHandler & E && movementX;
    y1 += draggedHandler & S && movementY;
    previousTouch = e.touches[0];
    dispatcher(ResizableLayerEvent.MOVE, { entityId, bounds });
  };

  const onHandlerMouseEnter = (handler: number) => {
    hoveredHandler = handler;
  };

  const onHandlerMouseDown = (handler: number) => {
    draggedHandler = handler;
  };

  const onSurfaceMouseEnter = () => {
    hoveredHandler = SURFACE;
    dispatcher(ResizableLayerEvent.ENTER, { entityId, bounds });
  };

  const onSurfaceMouseDown = () => {
    draggedHandler = SURFACE;
    dispatcher(ResizableLayerEvent.TOUCH, { entityId, bounds });
  };

  const onMouseLeave = () => {
    hoveredHandler = null;
  };

  const onMouseUp = () => {
    draggedHandler = null;
  };

  const onTouchStart = (e: TouchEvent) => {
    previousTouch = e.touches[0];
  };

  const onDoubleClick = (e: CustomEvent<LayerEventDetails>) => {
    dispatcher(ResizableLayerEvent.DOUBLE_CLICK, { entityId, data: e.detail, bounds });
  };

  const isOverlapped = (selectionPath: Point[]) => {
    const selectionBounds = geometryManager.getPathBounds(selectionPath);
    if (!selectionBounds) return false;
    return geometryManager.isOverlapping(selectionBounds, bounds);
  };

  const updateEntityData = () => {
    const rect = geometryManager.getRectDimensionFromBounds(bounds);
    canvasStore.updateShape(entityId, rect || {});
  };

  const cursor = (node: HTMLElement, _: unknown) => ({
    update: (cursorType: string) => (node.style.cursor = cursorType),
  });
</script>

<svelte:body
  use:cursor={handlerCursor(hoveredHandler ?? draggedHandler)}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
  on:touchstart={onTouchStart}
  on:touchmove={onTouchMove}
  on:pointerdown={onMouseUp}
/>

<slot {bounds} />

<Surface
  {bounds}
  active={selected}
  {selectOnMakingConnection}
  on:click={updateEntityData}
  on:dblclick={onDoubleClick}
  on:mouseleave={onMouseLeave}
  on:mouseenter={onSurfaceMouseEnter}
  on:mousedown={onSurfaceMouseDown}
  on:touchstart={(e) => {
    e.detail.originalEvent.preventDefault();
    onSurfaceMouseDown();
  }}
  on:mousedown
  on:touchstart
/>

{#if selected && !selectOnMakingConnection}
  {#each sortedHandlers as handler (handler)}
    <Handler
      {...getHandlerPosition(handler)}
      active={hoveredHandler === handler || draggedHandler === handler}
      on:click={updateEntityData}
      on:mouseleave={onMouseLeave}
      on:mouseenter={() => onHandlerMouseEnter(handler)}
      on:mousedown={() => onHandlerMouseDown(handler)}
      on:touchstart={(e) => {
        e.detail.originalEvent.preventDefault();
        onHandlerMouseDown(handler);
      }}
      on:mousedown
      on:touchstart
    />
  {/each}
{/if}
