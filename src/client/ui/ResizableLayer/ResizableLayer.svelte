<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import type { Point, Bounds, LayerEventDetails } from 'core/interfaces';
  import { geometryManager } from 'core/services';

  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import { DEFAULT_SCALE } from 'client/shared/constants';
  import { canvasStore } from 'client/ui/Canvas/store';
  import When from 'client/ui/When/When.svelte';

  import Surface from './ResizableLayerSurface.svelte';
  import Handler from './ResizableLayerHandler.svelte';
  import {
    ResizableLayerEvent,
    ResizableLayerAction,
    type ResizableLayerEventDispatcher,
  } from './interfaces';

  // TODO: Get rid of the bounds, use { x, y, width, height } instead
  export let entityId: string;
  export let initialBounds: Bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };
  export let selectionPath: Point[] = [];
  export let isSelected: boolean = false;
  export let selectOnMakingConnection: boolean = false;
  export let isMovingBlocked: boolean = false;

  const dispatcher = createEventDispatcher<ResizableLayerEventDispatcher>();
  const { shapes } = canvasStore;

  const [N, S, W, E] = [1, 2, 4, 8];
  const HANDLERS = [N | W, N | E, S | W, S | E];
  const SURFACE = N | S | W | E;

  let { x0, y0, x1, y1 } = initialBounds;
  let draggedHandler: number | null = null;
  let hoveredHandler: number | null = null;
  let currentAction: ResizableLayerAction | null = null;
  let previousTouch: Touch;
  let scale = DEFAULT_SCALE;

  onMount(() => {
    dispatcher(ResizableLayerEvent.ACTIVE, { entityId, bounds });
  });

  $: shape = $shapes.get(entityId) as BaseCanvasEntity<RectDrawOptions>;
  $: options = shape?.getOptions();
  $: initialWidth = options?.initialWidth ?? options?.width;
  $: initialHeight = options?.initialHeight ?? options?.height;

  $: bounds = { x0, y0, x1, y1 };
  $: active = Boolean(draggedHandler || hoveredHandler) || isOverlapped(selectionPath);
  $: selected = active || isSelected;

  $: active && dispatcher(ResizableLayerEvent.ACTIVE, { entityId, bounds });
  $: !active && dispatcher(ResizableLayerEvent.LEAVE, { entityId, bounds });

  $: getHandlerPosition = (handler: number): Point => {
    return {
      x: handler & W ? x0 - 5 : handler & E ? x1 + 5 : 0,
      y: handler & N ? y0 - 5 : handler & S ? y1 + 5 : 0,
    };
  };

  // TODO: Handle cursor type change on "mouseover" event
  $: handlerCursor = (handler: number | null): string => {
    if (handler === SURFACE) return 'pointer';

    if (handler === (N | W) || handler === (S | E)) {
      return 'nwse-resize';
    } else if (handler === (N | E) || handler === (S | W)) {
      return 'nesw-resize';
    }

    return 'auto';
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!draggedHandler || isMovingBlocked) return;

    const { movementX, movementY } = e;
    let x0t = bounds.x0 + (draggedHandler & W ? movementX : 0);
    let y0t = bounds.y0 + (draggedHandler & N ? movementY : 0);
    let x1t = bounds.x1 + (draggedHandler & E ? movementX : 0);
    let y1t = bounds.y1 + (draggedHandler & S ? movementY : 0);

    const { width, height } = geometryManager.getRectDimensionFromBounds({
      x0: x0t,
      y0: y0t,
      x1: x1t,
      y1: y1t,
    });

    const ceilWidth = Math.ceil(width);
    const ceilHeight = Math.ceil(height);

    if (ceilWidth < initialWidth || ceilHeight < initialHeight) return;

    x0 = x0t;
    y0 = y0t;
    x1 = x1t;
    y1 = y1t;

    if (draggedHandler === SURFACE) {
      currentAction = ResizableLayerAction.MOVE;
    } else {
      currentAction = ResizableLayerAction.RESIZE;
      scale = shape.getCalculatedScale(ceilWidth, ceilHeight);
    }

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
    canvasStore.updateShape(entityId, { ...rect, scale });
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

<Surface
  {entityId}
  {bounds}
  {scale}
  {currentAction}
  {selectOnMakingConnection}
  active={selected}
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

<When isVisible={selected && !selectOnMakingConnection}>
  {#each HANDLERS as handler (handler)}
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
</When>
