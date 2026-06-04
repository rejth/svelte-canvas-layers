<script lang="ts">
import { createEventDispatcher } from 'svelte'
import type { Bounds } from '@canvas/engine'

import ResizeHandle from './ResizeHandle.svelte'
import ResizeSurface from './ResizeSurface.svelte'

const [N, S, E, W] = [1, 2, 4, 8]
const HANDLES = [N, S, E, W, N | E, N | W, S | E, S | W]
const SURFACE = N | S | E | W

export let initialBounds: Bounds = { x0: 160, y0: 160, x1: 480, y1: 480 }

let x0 = initialBounds.x0
let y0 = initialBounds.y0
let x1 = initialBounds.x1
let y1 = initialBounds.y1

let hoveredHandle: number | null = null
let draggedHandle: number | null = null
let previousTouch: Touch | null = null

const dispatch = createEventDispatcher<{ activate: void }>()

$: bounds = { x0, y0, x1, y1 }
$: active = Boolean(hoveredHandle || draggedHandle)
$: sortedHandles = [...HANDLES].sort((a, b) =>
  a === hoveredHandle ? 1 : b === hoveredHandle ? -1 : 0,
)

const move = (movementX: number, movementY: number) => {
  const handle = draggedHandle
  if (!handle) return

  if (handle & W) x0 += movementX
  if (handle & N) y0 += movementY
  if (handle & E) x1 += movementX
  if (handle & S) y1 += movementY
}

const startDrag = (handle: number) => {
  draggedHandle = handle
  dispatch('activate')
}
</script>

<svelte:window
  on:mousemove={({ movementX, movementY }) => move(movementX, movementY)}
  on:mouseup={() => (draggedHandle = null)}
  on:pointerdown={() => (draggedHandle = null)}
  on:touchstart={(event) => (previousTouch = event.touches[0] ?? null)}
  on:touchmove|preventDefault={(event) => {
    const touch = event.touches[0]
    if (!touch || !previousTouch) return
    move(touch.clientX - previousTouch.clientX, touch.clientY - previousTouch.clientY)
    previousTouch = touch
  }}
  on:touchend={() => (draggedHandle = null)}
  on:touchcancel={() => (draggedHandle = null)}
/>

<slot {bounds} />

<ResizeSurface
  {bounds}
  show={active}
  on:mouseenter={() => (hoveredHandle = SURFACE)}
  on:mouseleave={() => (hoveredHandle = null)}
  on:mousedown={() => startDrag(SURFACE)}
  on:touchstart={() => startDrag(SURFACE)}
/>

{#if active}
  {#each sortedHandles as handle (handle)}
    <ResizeHandle
      active={handle === hoveredHandle || handle === draggedHandle}
      x={handle & W ? x0 : handle & E ? x1 : (x0 + x1) / 2}
      y={handle & N ? y0 : handle & S ? y1 : (y0 + y1) / 2}
      on:mouseenter={() => (hoveredHandle = handle)}
      on:mouseleave={() => (hoveredHandle = null)}
      on:mousedown={() => startDrag(handle)}
      on:touchstart={() => startDrag(handle)}
    />
  {/each}
{/if}
