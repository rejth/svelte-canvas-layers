<script lang="ts">
import { createEventDispatcher, onMount, setContext } from 'svelte'

import { WORKER_KEY } from '../constants'
import {
  type ColorPickEventDetail,
  type OriginalEvent,
  type Point,
  WorkerActionEnum,
  type WorkerAppContext,
} from '../interfaces'
import { createPickingWiring } from '../services'
import { calculatePosition } from '../services/geometry'
import { WorkerRenderManager } from '../services/WorkerRenderManager'

import { type CanvasPixelRatio, createResizeAction, derivePixelRatio } from './canvasScaffolding'

/**
 * Worker-mode canvas. Render-only by default; opt into worker hit-tested layer
 * events with `useLayerEvents` (off by default — D-06).
 */

/**
 * When unset, the canvas will use its clientWidth property.
 */
export let width: number | null = null
/**
 * When unset, the canvas will use its clientHeight property.
 */
export let height: number | null = null
/**
 * If pixelRatio is unset, the canvas uses the devicePixelRatio binding to match the window's pixel density.
 * If pixelRatio is set to "auto", the canvas-size library is used to automatically calculate the maximum supported pixel ratio based on the browser and canvas size.
 */
export let pixelRatio: CanvasPixelRatio = 'auto'
/**
 * Opt-in live color picking (off by default).
 */
export let enablePicking = false
/**
 * Opt-in worker hit-tested layer events (off by default — D-06). When false, no
 * hit-test traffic is posted and the worker keeps no resident hit canvas.
 */
export let useLayerEvents = false
/**
 * When true, pointer/touch move during a drag (buttons pressed / active touch)
 * dispatches to the current active layer without a new hit-test.
 */
export let handleEventsOnLayerMove = false
export let className = ''
export let style = ''

let canvas: HTMLCanvasElement
let canvasWidth: number
let canvasHeight: number
let devicePixelRatio: number | undefined

const workerManager = new WorkerRenderManager()

const dispatchPick = createEventDispatcher<{
  colorpeek: ColorPickEventDetail
  colorpick: ColorPickEventDetail
}>()

setContext<WorkerAppContext>(WORKER_KEY, { workerManager })

let lastPeekCss = { x: 0, y: 0 }
let lastPickCss = { x: 0, y: 0 }

const onPeek = (dx: number, dy: number, cssX: number, cssY: number) => {
  lastPeekCss = { x: cssX, y: cssY }
  workerManager.getColor(dx, dy)
}
const onPick = (dx: number, dy: number, cssX: number, cssY: number) => {
  lastPickCss = { x: cssX, y: cssY }
  workerManager.pick(dx, dy)
}

const picking = (node: HTMLCanvasElement) => {
  if (enablePicking) {
    return createPickingWiring({ onPeek, onPick, getPixelRatio: () => _pixelRatio })(node)
  }
  return { destroy() {} }
}

/**
 * Rect-relative backing-store (device-pixel) hit coordinates for the worker. Kept
 * internal — device pixels are never exposed to consumers (D-09). Returns null when
 * no touch point can be derived so no invalid coordinates are posted (T-07-02-TAMPER).
 */
const getHitPoint = (e: OriginalEvent): Point | null => {
  const rect = canvas.getBoundingClientRect()
  let clientX: number
  let clientY: number

  if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  } else {
    const touch = e.touches[0] ?? e.changedTouches[0]
    if (!touch) return null
    clientX = touch.clientX
    clientY = touch.clientY
  }

  return {
    x: (clientX - rect.left) * _pixelRatio,
    y: (clientY - rect.top) * _pixelRatio,
  }
}

/**
 * Public `LayerEventDetails.x/y`, matching main-thread semantics via `calculatePosition`.
 */
const getDetailPoint = (e: OriginalEvent): Point => calculatePosition(e)

const handleLayerMove = (e: MouseEvent) => {
  if (!handleEventsOnLayerMove) return

  const detailPoint = getDetailPoint(e)
  if (e.buttons > 0) {
    workerManager.dispatchCurrentLayerEvent(e, detailPoint)
    return
  }

  const hitPoint = getHitPoint(e)
  if (!hitPoint) return

  workerManager.requestLayerEvent({
    originalEvent: e,
    hitPoint,
    detailPoint,
    shouldFindActiveLayer: true,
    shouldDispatchOriginal: true,
    coalescable: true,
  })
}

const handleLayerTouchStart = (e: TouchEvent) => {
  const hitPoint = getHitPoint(e)
  if (!hitPoint) return

  workerManager.requestLayerEvent({
    originalEvent: e,
    hitPoint,
    detailPoint: getDetailPoint(e),
    shouldFindActiveLayer: true,
    shouldDispatchOriginal: true,
    coalescable: false,
  })
}

const handleLayerTouchMove = (e: TouchEvent) => {
  const detailPoint = getDetailPoint(e)

  if (handleEventsOnLayerMove && workerManager.activeLayerId) {
    workerManager.dispatchCurrentLayerEvent(e, detailPoint)
    return
  }

  const hitPoint = getHitPoint(e)
  if (!hitPoint) return

  workerManager.requestLayerEvent({
    originalEvent: e,
    hitPoint,
    detailPoint,
    shouldFindActiveLayer: true,
    shouldDispatchOriginal: true,
    coalescable: true,
  })
}

const handleLayerEvent = (e: OriginalEvent) => {
  const detailPoint = getDetailPoint(e)

  // Mirror Canvas.svelte: refresh the active layer on every discrete event when
  // move-targeting is off, otherwise only on mousedown/pointerdown.
  const shouldFindActiveLayer =
    !handleEventsOnLayerMove || e.type === 'mousedown' || e.type === 'pointerdown'

  if (!shouldFindActiveLayer) {
    workerManager.dispatchCurrentLayerEvent(e, detailPoint)
    return
  }

  const hitPoint = getHitPoint(e)
  if (!hitPoint) return

  workerManager.requestLayerEvent({
    originalEvent: e,
    hitPoint,
    detailPoint,
    shouldFindActiveLayer: true,
    shouldDispatchOriginal: true,
    coalescable: false,
  })
}

const handleLayerCancel = (e: OriginalEvent) => {
  workerManager.leaveActiveLayer(e, getDetailPoint(e))
}

const resize = createResizeAction((w, h) => {
  canvasWidth = w
  canvasHeight = h
})

onMount(() => {
  workerManager.init(canvas, { useLayerEvents })

  if (enablePicking) {
    workerManager.onColor = (action, hex) => {
      const isPick = action === WorkerActionEnum.PICK_COLOR
      const css = isPick ? lastPickCss : lastPeekCss
      dispatchPick(isPick ? 'colorpick' : 'colorpeek', { hex, x: css.x, y: css.y })
    }
  }

  return () => workerManager.destroy()
})

$: _width = width ?? canvasWidth ?? 0
$: _height = height ?? canvasHeight ?? 0

$: _pixelRatio = derivePixelRatio({
  width: _width,
  height: _height,
  devicePixelRatio,
  pixelRatio,
})

$: workerManager.width = _width
$: workerManager.height = _height
$: workerManager.pixelRatio = _pixelRatio

$: _width, _height, _pixelRatio, workerManager.resize()

// Bridge post-init prop changes; the initial flag is set deterministically in init().
$: workerManager.setUseLayerEvents(useLayerEvents)

// Bind layer-event handlers only when opted in (D-06).
$: moveHandler = useLayerEvents ? handleLayerMove : null
$: touchStartHandler = useLayerEvents ? handleLayerTouchStart : null
$: touchMoveHandler = useLayerEvents ? handleLayerTouchMove : null
$: cancelHandler = useLayerEvents ? handleLayerCancel : null
$: layerEventHandler = useLayerEvents ? handleLayerEvent : null
</script>

<svelte:window bind:devicePixelRatio />

<canvas
  bind:this={canvas}
  use:resize
  use:picking
  bind:clientWidth={canvasWidth}
  bind:clientHeight={canvasHeight}
  class={className}
  width={_width * _pixelRatio}
  height={_height * _pixelRatio}
  style:width={width ? `${width}px` : '100%'}
  style:height={height ? `${height}px` : '100%'}
  {style}
  on:mousemove={moveHandler}
  on:pointermove={moveHandler}
  on:touchstart={touchStartHandler}
  on:touchmove={touchMoveHandler}
  on:touchend={layerEventHandler}
  on:touchcancel={cancelHandler}
  on:pointercancel={cancelHandler}
  on:click={layerEventHandler}
  on:contextmenu={layerEventHandler}
  on:dblclick={layerEventHandler}
  on:mousedown={layerEventHandler}
  on:mouseup={layerEventHandler}
  on:wheel={layerEventHandler}
  on:pointerdown={layerEventHandler}
  on:pointerup={layerEventHandler}
/>

<slot />
