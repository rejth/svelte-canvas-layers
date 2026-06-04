<script lang="ts">
import type {
  Bounds,
  ColorPickEventDetail,
  LayerEventDetails,
  Render,
  WorkerRender,
} from '@canvas/engine'
import { Canvas, Layer, WorkerCanvas, WorkerLayer } from '@canvas/engine'

import type { Mode } from '../../shared/modeArg'

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

// --- Worker mode (D-11/D-12): draggable whole boxes via public @canvas/engine API ---

type WorkerBox = { id: string; color: string; x0: number; y0: number; x1: number; y1: number }

// Top-level, fully self-contained worker render fn: references only its own
// arguments + native canvas APIs. All dynamic bounds/color flow through `data`,
// never a closure (the source is serialized + reconstructed inside the worker).
const workerBoxRender: WorkerRender = ({ ctx, data }) => {
  const box = data as WorkerBox
  ctx.globalAlpha = 0.9
  ctx.fillStyle = box.color
  ctx.fillRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0)
  ctx.globalAlpha = 1
}

let workerBoxes: WorkerBox[] = [
  { id: 'tomato', color: 'tomato', x0: 90, y0: 70, x1: 330, y1: 310 },
  { id: 'sun', color: '#ffd670', x0: 220, y0: 130, x1: 460, y1: 370 },
  { id: 'turquoise', color: 'mediumturquoise', x0: 350, y0: 190, x1: 590, y1: 430 },
]

let draggingId: string | null = null
let lastPoint: { x: number; y: number } | null = null

// Independent readouts prove layer events and color picking are separate public
// event families (D-07): layer handlers update these, picking handlers update HEX.
let lastLayerEvent = '—'
let activeTarget = '—'
let lastPeekHex = '—'
let lastPickHex = '—'

// Move the active box to the end of the array on press so it is the topmost
// drag target. (Worker hit/draw order follows WorkerLayer registration order; the
// keyed `{#each}` reorders DOM only, but this keeps the story's intent explicit.)
const workerSortToFront = (id: string) => {
  workerBoxes = workerBoxes
    .filter((box) => box.id !== id)
    .concat(workerBoxes.filter((box) => box.id === id))
}

const moveBox = (id: string, dx: number, dy: number) => {
  workerBoxes = workerBoxes.map((box) =>
    box.id === id
      ? { ...box, x0: box.x0 + dx, y0: box.y0 + dy, x1: box.x1 + dx, y1: box.y1 + dy }
      : box,
  )
}

const onLayerDown = (box: WorkerBox) => (event: CustomEvent<LayerEventDetails>) => {
  draggingId = box.id
  lastPoint = { x: event.detail.x, y: event.detail.y }
  activeTarget = `${box.id} (${box.color})`
  lastLayerEvent = `mousedown → ${box.id}`
  workerSortToFront(box.id)
}

const onLayerMove = (box: WorkerBox) => (event: CustomEvent<LayerEventDetails>) => {
  if (draggingId !== box.id) return

  const { originalEvent } = event.detail
  let dx = 0
  let dy = 0

  if (originalEvent instanceof MouseEvent) {
    dx = originalEvent.movementX
    dy = originalEvent.movementY
  } else if (lastPoint) {
    dx = event.detail.x - lastPoint.x
    dy = event.detail.y - lastPoint.y
  }

  lastPoint = { x: event.detail.x, y: event.detail.y }
  moveBox(box.id, dx, dy)
}

// Clear only on up/cancel — clearing on mouseleave would abort fast drags that
// momentarily leave the box, since during a drag moves route to the active layer.
const onLayerUp = () => {
  draggingId = null
  lastPoint = null
  lastLayerEvent = 'mouseup'
}

const onLayerEnter = (box: WorkerBox) => () => {
  lastLayerEvent = `enter → ${box.id}`
}

const onLayerLeave = (box: WorkerBox) => () => {
  lastLayerEvent = `leave → ${box.id}`
}

const onLayerClick = (box: WorkerBox) => () => {
  activeTarget = `${box.id} (${box.color})`
  lastLayerEvent = `click → ${box.id}`
}

const onColorPeek = (event: CustomEvent<ColorPickEventDetail>) => {
  lastPeekHex = event.detail.hex
}

const onColorPick = (event: CustomEvent<ColorPickEventDetail>) => {
  lastPickHex = event.detail.hex
}
</script>

<div class="story-viewport">
  {#if mode === 'worker'}
    <WorkerCanvas
      useLayerEvents
      handleEventsOnLayerMove
      enablePicking
      style="display:block;cursor:crosshair;"
      on:colorpeek={onColorPeek}
      on:colorpick={onColorPick}
    >
      {#each workerBoxes as box (box.id)}
        <WorkerLayer
          render={workerBoxRender}
          data={box}
          on:mousedown={onLayerDown(box)}
          on:mousemove={onLayerMove(box)}
          on:mouseup={onLayerUp}
          on:mouseenter={onLayerEnter(box)}
          on:mouseleave={onLayerLeave(box)}
          on:pointerenter={onLayerEnter(box)}
          on:pointerleave={onLayerLeave(box)}
          on:click={onLayerClick(box)}
        />
      {/each}
    </WorkerCanvas>

    <div class="readout">
      <div><strong>worker layer events</strong></div>
      <div>active target: {activeTarget}</div>
      <div>last layer event: {lastLayerEvent}</div>
      <div><strong>color picking (independent)</strong></div>
      <div>peek: {lastPeekHex}</div>
      <div>pick: {lastPickHex}</div>
    </div>
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

  .readout {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(17, 24, 39, 0.82);
    color: #f8fafc;
    font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    pointer-events: none;
  }
</style>
