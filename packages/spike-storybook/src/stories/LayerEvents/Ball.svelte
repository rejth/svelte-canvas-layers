<script lang="ts">
import { createEventDispatcher, getContext, onDestroy } from 'svelte'
import { spring } from 'svelte/motion'
import type { AppContext, LayerEventDetails, Render } from '@canvas/engine'
import { KEY, Layer } from '@canvas/engine'

export let x: number
export let y: number
export let color: string

let dragging = false
let initialized = false
let canvasWidth = 0
let canvasHeight = 0

const positionX = spring(0, { stiffness: 0.15, damping: 0.2 })
const positionY = spring(0, { stiffness: 0.15, damping: 0.2 })
const radius = spring(80, { stiffness: 0.15, damping: 0.2 })

const dispatch = createEventDispatcher<{ activate: void }>()
const { layerManager } = getContext<AppContext>(KEY)

const unsubscribeMotion = [
  positionX.subscribe(layerManager.redraw),
  positionY.subscribe(layerManager.redraw),
  radius.subscribe(layerManager.redraw),
]

const setCursor = (cursor: string) => {
  document.body.style.cursor = cursor
}

onDestroy(() => {
  setCursor('auto')
  unsubscribeMotion.forEach((unsubscribe) => unsubscribe())
})

const render: Render = ({ ctx, renderer }) => {
  if (!initialized || renderer.width !== canvasWidth || renderer.height !== canvasHeight) {
    canvasWidth = renderer.width
    canvasHeight = renderer.height
    initialized = true

    positionX.set(renderer.width * x, { hard: true })
    positionY.set(renderer.height * y, { hard: true })
  }

  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = color
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc($positionX, $positionY, $radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
}

const onEnter = () => {
  setCursor('pointer')
  radius.set(90)
}

const onLeave = () => {
  if (dragging) return

  setCursor('auto')
  radius.set(80)
}

const onDown = () => {
  dragging = true
  radius.set(120)
  dispatch('activate')
}

const onUp = () => {
  dragging = false
  radius.set(80)
}

const onMove = ({ detail }: CustomEvent<LayerEventDetails>) => {
  if (!dragging) return

  positionX.set(detail.x)
  positionY.set(detail.y)
}
</script>

<Layer
  {render}
  on:mouseenter={onEnter}
  on:mouseleave={onLeave}
  on:mousedown={onDown}
  on:mousemove={onMove}
  on:mouseup={onUp}
  on:touchstart={onDown}
  on:touchmove={onMove}
  on:touchend={onUp}
/>
