<script lang="ts">
import { createEventDispatcher, onMount, setContext } from 'svelte'

import { WORKER_KEY } from '../constants'
import { type ColorPickEventDetail, WorkerActionEnum, type WorkerAppContext } from '../interfaces'
import { WorkerRenderManager } from '../services/WorkerRenderManager'
import { createPickingWiring, createResizeAction, derivePixelRatio } from './canvasScaffolding'

/**
 * Worker-mode canvas. Selecting worker rendering means reaching for
 * <WorkerCanvas> rather than flagging <Canvas> (D-01/D-08). This component owns
 * the WorkerRenderManager, transfers its canvas to the worker on mount, pushes
 * size/pixel-ratio changes, and terminates the worker on destroy. It is
 * render-only this phase — no hit-testing / layer events.
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
export let pixelRatio: 'auto' | null = 'auto'
/**
 * Opt-in live color picking (off by default — D-02 zero overhead). Mirrors
 * <Canvas>'s prop name (D-01 symmetric family). When true, the same shared
 * createPickingWiring action posts GET_COLOR/PICK_COLOR to the worker; the async
 * HEX comes back via workerManager.onColor and is dispatched as colorpeek/colorpick
 * with the IDENTICAL { hex, x, y } CSS-pixel payload as the main-thread Canvas
 * (PICK-04 / D-03 — the round-trip is invisible to the consumer). When false, no
 * onColor is set and no pointer listeners are attached (D-02).
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

// D-03: provide the manager under the DISTINCT worker key, so a WorkerLayer
// under a main-thread <Canvas> resolves no worker context (and vice versa).
setContext<WorkerAppContext>(WORKER_KEY, { workerManager })

// The worker posts back device-pixel x/y, but the emitted event payload must be
// CSS-pixel to match the main-thread Canvas (OQ2). Peek is rAF-coalesced to <=1
// in-flight request per frame, so the stashed CSS coord matches the response that
// arrives for it (Pitfall 4 — no stale-value flicker).
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

// Apply the shared picking action only when picking is on (same null-safe local-action
// pattern as Canvas.svelte). When off, returns a no-op so no listeners attach (D-02).
const picking = (node: HTMLCanvasElement) =>
  enablePicking
    ? createPickingWiring({ onPeek, onPick, getPixelRatio: () => _pixelRatio })(node)
    : { destroy() {} }

const resize = createResizeAction((w, h) => {
  canvasWidth = w
  canvasHeight = h
})

onMount(() => {
  // Pitfall 6: fail loudly on unsupported browsers rather than silently no-op.
  if (
    typeof OffscreenCanvas === 'undefined' ||
    !('transferControlToOffscreen' in HTMLCanvasElement.prototype)
  ) {
    throw new Error('Worker rendering requires OffscreenCanvas support')
  }

  // WRK-01: transfer canvas ownership to the worker and INIT.
  workerManager.init(canvas)

  // Route the async worker HEX response to colorpeek/colorpick with the stashed
  // CSS-pixel coords (D-03 — identical surface to the main-thread Canvas). Only
  // wired when picking is on (D-02).
  if (enablePicking) {
    workerManager.onColor = (action, hex) => {
      const css = action === WorkerActionEnum.PICK_COLOR ? lastPickCss : lastPeekCss
      dispatchPick(action === WorkerActionEnum.PICK_COLOR ? 'colorpick' : 'colorpeek', {
        hex,
        x: css.x,
        y: css.y,
      })
    }
  }

  // Pitfall 5: terminate the worker on unmount/HMR.
  return () => workerManager.destroy()
})

$: _width = width ?? canvasWidth ?? 0
$: _height = height ?? canvasHeight ?? 0

/**
 * Resolve the numeric pixel ratio via the shared scaffolding helper (D-02). When
 * pixelRatio is "auto", this uses the canvas-size-validated maximum ratio.
 */
$: _pixelRatio = derivePixelRatio({
  width: _width,
  height: _height,
  devicePixelRatio,
  pixelRatio,
})

/**
 * Push size / pixel-ratio into the manager each time they change.
 */
$: workerManager.width = _width
$: workerManager.height = _height
$: workerManager.pixelRatio = _pixelRatio

/**
 * Re-post RESIZE whenever the resolved size or pixel ratio changes (WRK-04).
 * Mirrors Canvas.svelte's layerManager.redraw() trigger.
 */
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
