<script lang="ts">
import type { Bounds, Render } from '@canvas/engine'
import { Canvas, Layer } from '@canvas/engine'

import type { Mode } from '../../shared/modeArg'
import WorkerUnsupported from '../../shared/WorkerUnsupported.svelte'

import ResizeBox from './ResizeBox.svelte'

export let mode: Mode = 'main'

type Box = {
  color: string
  initialBounds: Bounds
}

let boxes: Box[] = [
  { color: 'tomato', initialBounds: { x0: 90, y0: 70, x1: 330, y1: 310 } },
  { color: '#ffd670', initialBounds: { x0: 220, y0: 130, x1: 460, y1: 370 } },
  { color: 'mediumturquoise', initialBounds: { x0: 350, y0: 190, x1: 590, y1: 430 } },
]

const sortToFront = (color: string) => {
  boxes = boxes
    .filter((box) => box.color !== color)
    .concat(boxes.filter((box) => box.color === color))
}

const contentRender =
  (bounds: Bounds, color: string): Render =>
  ({ ctx }) => {
    const { x0, y0, x1, y1 } = bounds
    ctx.globalAlpha = 0.9
    ctx.fillStyle = color
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
    ctx.globalAlpha = 1
  }
</script>

<div class="story-viewport">
  {#if mode === 'worker'}
    <WorkerUnsupported feature="Resize handles" />
  {:else}
    <Canvas
      useLayerEvents
      handleEventsOnLayerMove
    >
      {#each boxes as box (box.color)}
        <ResizeBox initialBounds={box.initialBounds} on:activate={() => sortToFront(box.color)} let:bounds>
          <Layer render={contentRender(bounds, box.color)} />
        </ResizeBox>
      {/each}
    </Canvas>
  {/if}
</div>

<style>
  .story-viewport {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #fff;
  }
</style>
