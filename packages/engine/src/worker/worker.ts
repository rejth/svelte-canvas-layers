import * as Comlink from 'comlink'

import { pickColor } from '../common/colorPicking'
import { convertLayerIdToRGB, convertRGBtoLayerId } from '../common/hitCanvasColors'
import type { LayerId } from '../common/types'

import type { WorkerApi, WorkerRenderRegistry } from './types'
import { createForcedColorContext } from './workerHitCanvas'

interface Drawer {
  renderer: string
  data: unknown
}

let offscreenCanvas: OffscreenCanvas | null = null
let context: OffscreenCanvasRenderingContext2D | null = null
const drawers: Map<LayerId, Drawer> = new Map()
let layerSequence: LayerId[] = []

let width = 0
let height = 0
let pixelRatio = 1
let frame: number | null = null
let needsRedraw = true

// Worker-resident hit canvas. Created only when layer events are
// enabled, so worker mode pays zero hit-canvas overhead when they are off.
let useLayerEvents = false
let hitCanvas: OffscreenCanvas | null = null
let hitContext: OffscreenCanvasRenderingContext2D | null = null
let forcedHitContext: OffscreenCanvasRenderingContext2D | null = null
let activeHitColor = 'rgb(0,0,0)'

/**
 * Lazily create the resident hit canvas + forced-color context when layer
 * events are enabled. No-op when events are off or the canvas already exists.
 */
function ensureHitCanvas() {
  if (!useLayerEvents || hitContext) return

  hitCanvas = new OffscreenCanvas(width * pixelRatio, height * pixelRatio)
  hitContext = hitCanvas.getContext('2d', settings)
  if (!hitContext) {
    hitCanvas = null
    return
  }
  forcedHitContext = createForcedColorContext(hitContext, () => activeHitColor)
}

/**
 * Replay every drawer into the hit canvas with a per-layer forced color id so a
 * later 1x1 read-back resolves a coordinate to its `LayerId`.
 */
function renderHitCanvas(renderers: WorkerRenderRegistry) {
  if (!useLayerEvents || !hitContext || !forcedHitContext) return

  hitContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  hitContext.clearRect(0, 0, width, height)

  for (const layerId of getLayerSequence()) {
    const layer = drawers.get(layerId)
    if (!layer) continue
    const draw = renderers[layer.renderer]
    if (!draw) continue
    const [r, g, b] = convertLayerIdToRGB(layerId)
    activeHitColor = `rgb(${r},${g},${b})`
    draw({ ctx: forcedHitContext!, width, height, pixelRatio, data: layer.data })
  }
}

/**
 * Resolve a backing-store coordinate to a `LayerId` by reading a single hit pixel.
 */
function readHitLayerId(x: number, y: number): LayerId {
  if (!hitContext || !Number.isFinite(x) || !Number.isFinite(y)) return 0
  try {
    const [r, g, b] = hitContext.getImageData(x, y, 1, 1).data
    return convertRGBtoLayerId([r, g, b])
  } catch {
    return 0
  }
}

/**
 * Offscreen canvas settings for rendering optimization.
 */
const settings: CanvasRenderingContext2DSettings = {
  willReadFrequently: true,
}

function getLayerSequence(): LayerId[] {
  return layerSequence.length ? layerSequence : [...drawers.keys()]
}

function startRenderLoop(renderers: WorkerRenderRegistry) {
  render(renderers)
  frame = requestAnimationFrame(() => startRenderLoop(renderers))
}

/**
 * The main render function which is responsible for drawing, clearing and canvas's
 * transformation matrix adjustment. Renders only when width, height or pixelRatio change.
 */
function render(renderers: WorkerRenderRegistry) {
  if (!context || !needsRedraw) return

  // Re-apply the transform every redraw so a resize-driven pixelRatio change takes effect.
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)

  for (const layerId of getLayerSequence()) {
    const layer = drawers.get(layerId)
    if (!layer) continue
    const draw = renderers[layer.renderer]
    if (!draw) continue
    draw({ ctx: context!, width, height, pixelRatio, data: layer.data })
  }

  renderHitCanvas(renderers)

  needsRedraw = false
}

export function exposeCanvasWorker(renderers: WorkerRenderRegistry) {
  const workerApi: WorkerApi = {
    init(payload) {
      offscreenCanvas = payload.canvas
      context = offscreenCanvas.getContext('2d', settings)
      width = payload.width
      height = payload.height
      pixelRatio = payload.pixelRatio
      useLayerEvents = payload.useLayerEvents
      ensureHitCanvas()

      startRenderLoop(renderers)
    },

    resize(payload) {
      width = payload.width ?? width
      height = payload.height ?? height
      pixelRatio = payload.pixelRatio ?? pixelRatio
      if (payload.useLayerEvents != null) useLayerEvents = payload.useLayerEvents

      if (offscreenCanvas) {
        offscreenCanvas.width = width * pixelRatio
        offscreenCanvas.height = height * pixelRatio
      }

      // Lazily create the hit canvas if events were just enabled, otherwise
      // keep it sized in lockstep with the display canvas.
      ensureHitCanvas()
      if (hitCanvas) {
        hitCanvas.width = width * pixelRatio
        hitCanvas.height = height * pixelRatio
      }

      needsRedraw = true
    },

    addDrawer(payload) {
      if (!renderers[payload.renderer]) {
        throw new Error(`Unknown worker renderer: "${payload.renderer}"`)
      }

      drawers.set(payload.layerId, {
        renderer: payload.renderer,
        data: payload.data,
      })
      needsRedraw = true
    },

    removeDrawer(layerId) {
      drawers.delete(layerId)
      layerSequence = layerSequence.filter((currentLayerId) => currentLayerId !== layerId)
      needsRedraw = true
    },

    setLayerSequence(payload) {
      layerSequence = payload.layerSequence
      needsRedraw = true
    },

    updateData(payload) {
      const layer = drawers.get(payload.layerId)
      if (layer) layer.data = payload.data
      needsRedraw = true
    },

    pickColor(x, y) {
      if (!offscreenCanvas || !context) return null

      try {
        return { hex: pickColor(context, x, y), x, y }
      } catch {
        return null
      }
    },

    hitTest(payload) {
      if (needsRedraw) render(renderers)
      return {
        requestId: payload.requestId,
        layerId: readHitLayerId(payload.x, payload.y),
      }
    },
  }

  Comlink.expose(workerApi)
}

self.addEventListener('close', () => {
  if (frame !== null) cancelAnimationFrame(frame)
})
