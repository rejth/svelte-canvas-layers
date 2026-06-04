<script lang="ts">
import { onMount, setContext } from 'svelte'

import { WORKER_KEY } from '../constants'
import type { WorkerAppContext } from '../interfaces'
import { WorkerRenderManager } from '../services/WorkerRenderManager'
import { createResizeAction, derivePixelRatio } from './canvasScaffolding'

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
export let className = ''
export let style = ''

let canvas: HTMLCanvasElement
let canvasWidth: number
let canvasHeight: number
let devicePixelRatio: number | undefined

const workerManager = new WorkerRenderManager()

// D-03: provide the manager under the DISTINCT worker key, so a WorkerLayer
// under a main-thread <Canvas> resolves no worker context (and vice versa).
setContext<WorkerAppContext>(WORKER_KEY, { workerManager })

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
