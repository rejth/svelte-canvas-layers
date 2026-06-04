<script lang="ts">
import { createEventDispatcher, onMount, setContext } from 'svelte'

import { WORKER_KEY } from '../constants'
import { type ColorPickEventDetail, WorkerActionEnum, type WorkerAppContext } from '../interfaces'
import { createPickingWiring } from '../services'
import { WorkerRenderManager } from '../services/WorkerRenderManager'

import { type CanvasPixelRatio, createResizeAction, derivePixelRatio } from './canvasScaffolding'

/**
 * Worker-mode canvas. It is render-only — no hit-testing / layer events.
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

const resize = createResizeAction((w, h) => {
  canvasWidth = w
  canvasHeight = h
})

onMount(() => {
  workerManager.init(canvas)

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
/>

<slot />
