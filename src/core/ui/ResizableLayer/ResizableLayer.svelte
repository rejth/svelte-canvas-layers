<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { Point, Bounds } from 'core/interfaces';
  import { geometryManager } from 'core/services';

  import Surface from './ResizableLayerSurface.svelte';
  import Handler from './ResizableLayerHandler.svelte';
  import { LayerEvent, type LayerEventDetails } from './interfaces';

  export let initialBounds: Bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };
  export let selectionPath: Point[] = [];
  export let isSelected: boolean = false;
  export let selectOnMakingConnection: boolean = false;
  export let isMovingBlocked: boolean = false;

  const dispatcher = createEventDispatcher<Record<LayerEvent, LayerEventDetails>>();

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

  $: active && dispatcher(LayerEvent.ACTIVE, { bounds });
  $: !active && dispatcher(LayerEvent.LEAVE);

  const isOverlapped = (selectionPath: Point[]) => {
    const selectionBounds = geometryManager.getPathBounds(selectionPath);
    if (!selectionBounds) return false;
    return geometryManager.isOverlapping(selectionBounds, bounds);
  };

  $: sortedHandlers = HANDLERS.sort((a, b) =>
    a === hoveredHandler ? 1 : b === hoveredHandler ? -1 : 0,
  );

  $: getHandlerPosition = (handler: number): Point => {
    return {
      x: handler & W ? x0 - 5 : handler & E ? x1 + 5 : geometryManager.getMiddlePoint(x0, x1),
      y: handler & N ? y0 - 5 : handler & S ? y1 + 5 : geometryManager.getMiddlePoint(y0, y1),
    };
  };

  $: handlerCursor = (handler: number | null): string => {
    if (!handler) return selected ? 'pointer' : 'auto';

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
    dispatcher(LayerEvent.MOVE, { bounds });
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
    dispatcher(LayerEvent.MOVE, { bounds });
  };

  const onHandlerMouseEnter = (handler: number) => (hoveredHandler = handler);
  const onSurfaceMouseEnter = () => {
    hoveredHandler = SURFACE;
    dispatcher(LayerEvent.ENTER, { bounds });
  };

  const onHandlerMouseDown = (handler: number) => (draggedHandler = handler);
  const onSurfaceMouseDown = () => {
    draggedHandler = SURFACE;
    dispatcher(LayerEvent.TOUCH, { bounds });
  };

  const onMouseLeave = () => (hoveredHandler = null);
  const onMouseUp = () => (draggedHandler = null);
  const onTouchStart = (e: TouchEvent) => (previousTouch = e.touches[0]);

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
