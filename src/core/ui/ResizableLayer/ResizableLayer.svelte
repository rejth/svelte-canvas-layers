<script lang="ts">
  import { getContext } from 'svelte';

  import { KEY } from 'core/constants';
  import { type Point, type AppContext, type Bounds } from 'core/interfaces';

  import Surface from './ResizableLayerSurface.svelte';
  import Handler from './ResizableLayerHandler.svelte';

  export let path: Point[] | null = null;
  export let initialBounds: Bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };

  const [N, S, W, E] = [1, 2, 4, 8];
  const HANDLERS = [N, S, W, E, N | W, N | E, S | W, S | E];
  const SURFACE = N | S | W | E;

  const { renderManager } = getContext<AppContext>(KEY);
  const { geometryManager } = renderManager;

  let { x0, y0, x1, y1 } = path ? geometryManager.getPathBounds(path) : initialBounds;
  let draggedHandler: number | null = null;
  let hoveredHandler: number | null = null;
  let previousTouch: Touch;

  $: bounds = { x0, y0, x1, y1 };
  $: active = Boolean(draggedHandler || hoveredHandler);
  $: sortedHandlers = HANDLERS.sort((a, b) =>
    a === hoveredHandler ? 1 : b === hoveredHandler ? -1 : 0,
  );

  $: getHandlerPosition = (handler: number): Point => {
    return {
      x: handler & W ? x0 : handler & E ? x1 : geometryManager.getMiddlePoint(x0, x1),
      y: handler & N ? y0 : handler & S ? y1 : geometryManager.getMiddlePoint(y0, y1),
    };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!draggedHandler) return;
    const { movementX, movementY } = e;
    x0 += draggedHandler & W && movementX;
    y0 += draggedHandler & N && movementY;
    x1 += draggedHandler & E && movementX;
    y1 += draggedHandler & S && movementY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!draggedHandler) return;
    const { clientX, clientY } = e.touches[0];
    const movementX = clientX - previousTouch.clientX;
    const movementY = clientY - previousTouch.clientY;
    x0 += draggedHandler & W && movementX;
    y0 += draggedHandler & N && movementY;
    x1 += draggedHandler & E && movementX;
    y1 += draggedHandler & S && movementY;
    previousTouch = e.touches[0];
  };

  const onSurfaceMouseEnter = () => (hoveredHandler = SURFACE);
  const onHandlerMouseEnter = (handler: number) => (hoveredHandler = handler);

  const onSurfaceMouseDown = () => (draggedHandler = SURFACE);
  const onHandlerMouseDown = (handler: number) => (draggedHandler = handler);

  const onMouseLeave = () => (hoveredHandler = null);
  const onMouseUp = () => (draggedHandler = null);
  const onTouchStart = (e: TouchEvent) => (previousTouch = e.touches[0]);

  const cursor = (node: HTMLElement, _: unknown) => ({
    update: (cursorType: string) => (node.style.cursor = cursorType),
  });
</script>

<svelte:body
  use:cursor={active ? 'pointer' : 'auto'}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
  on:touchstart={onTouchStart}
  on:touchmove={onTouchMove}
  on:pointerdown={onMouseUp}
/>

<slot {bounds} />

<Surface
  {active}
  {bounds}
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

{#if active}
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
