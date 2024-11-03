<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { Point } from 'core/interfaces';
  import { geometryManager } from 'core/services';

  import ControlPoint from './Point.svelte';
  import { CurveLayerEvent, type CurveLayerEventDetails } from './interfaces';

  export let controlPoints: Point[];
  export let selectOnMakingConnection: boolean = false;

  const dispatcher = createEventDispatcher<Record<CurveLayerEvent, CurveLayerEventDetails>>();

  let selectedPoint: number | null = null;
  let draggedHandler: number | null = null;
  let hoveredHandler: number | null = null;

  $: active = draggedHandler !== null || hoveredHandler !== null;

  const handleMouseLeave = () => {
    hoveredHandler = null;
    dispatcher(CurveLayerEvent.LEAVE);
  };

  const handleMouseUp = () => {
    draggedHandler = null;
    selectedPoint = null;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (selectedPoint === null) return;

    dispatcher(CurveLayerEvent.MOVE, {
      index: selectedPoint,
      point: geometryManager.calculatePosition(e),
    });
  };

  const handleMouseEnter = (handle: number) => {
    hoveredHandler = handle;
  };

  const handleMouseDown = (handle: number) => {
    draggedHandler = handle;
    selectedPoint = handle;
    dispatcher(CurveLayerEvent.TOUCH);
  };

  const cursor = (node: HTMLElement, _: unknown) => ({
    update: (cursorType: string) => (node.style.cursor = cursorType),
  });
</script>

<svelte:body
  use:cursor={active && !selectOnMakingConnection ? 'pointer' : 'auto'}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
/>

<slot />

{#each controlPoints as point, index}
  <ControlPoint
    {point}
    active={!selectOnMakingConnection && (hoveredHandler === index || draggedHandler === index)}
    on:mouseleave={handleMouseLeave}
    on:mouseenter={() => handleMouseEnter(index)}
    on:mousedown={() => handleMouseDown(index)}
  />
{/each}
