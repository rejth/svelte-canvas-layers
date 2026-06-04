import JSONfn from 'json-fn'

import { type LayerId, WorkerActionEnum, type WorkerEvent, type WorkerRender } from '../layerTypes'

import { pickColor } from './colorPicking'
import { convertLayerIdToRGB, convertRGBtoLayerId } from './hitCanvasColors'
import { createForcedColorContext } from './workerHitCanvas'

interface Drawer {
  render: WorkerRender
  data: unknown
}

let offscreenCanvas: OffscreenCanvas | null = null
let context: OffscreenCanvasRenderingContext2D | null = null
const drawers: Map<LayerId, Drawer> = new Map()

let width = 0
let height = 0
let pixelRatio = 1
let frame: number | null = null
let needsRedraw = true

// Worker-resident hit canvas (D-06/D-08). Created only when layer events are
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
 * later 1x1 read-back resolves a coordinate to its `LayerId` (D-02/D-08).
 */
function renderHitCanvas() {
  if (!useLayerEvents || !hitContext || !forcedHitContext) return

  hitContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  hitContext.clearRect(0, 0, width, height)

  drawers.forEach(({ render: draw, data }, layerId) => {
    const [r, g, b] = convertLayerIdToRGB(layerId)
    activeHitColor = `rgb(${r},${g},${b})`
    draw({ ctx: forcedHitContext!, width, height, pixelRatio, data })
  })
}

/**
 * Resolve a backing-store coordinate to a `LayerId` by reading a single hit
 * pixel. Returns 0 when the hit context is missing, the coordinates are not
 * finite, or `getImageData` throws (D-01/security).
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

function startRenderLoop() {
  render()
  frame = requestAnimationFrame(() => startRenderLoop())
}

/**
 * The main render function which is responsible for drawing, clearing and canvas's
 * transformation matrix adjustment. Renders only when width, height or pixelRatio change.
 */
function render() {
  if (!context || !needsRedraw) return

  // Re-apply the transform every redraw so a resize-driven pixelRatio change takes effect.
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)

  drawers.forEach(({ render: draw, data }) => {
    draw({ ctx: context!, width, height, pixelRatio, data })
  })

  renderHitCanvas()

  needsRedraw = false
}

self.onmessage = (e: MessageEvent<WorkerEvent>) => {
  const { action } = e.data

  switch (action) {
    case WorkerActionEnum.INIT:
      offscreenCanvas = e.data.canvas ?? null
      context = offscreenCanvas?.getContext('2d', settings) ?? null
      width = e.data.width ?? 0
      height = e.data.height ?? 0
      pixelRatio = e.data.pixelRatio ?? 1
      useLayerEvents = e.data.useLayerEvents ?? false
      ensureHitCanvas()

      if (e.data.drawers) {
        const initial = JSONfn.parse(e.data.drawers) as Array<[LayerId, Drawer]>
        for (const [layerId, layer] of initial) {
          drawers.set(layerId, layer)
        }
      }

      startRenderLoop()
      break

    case WorkerActionEnum.RESIZE:
      width = e.data.width ?? width
      height = e.data.height ?? height
      pixelRatio = e.data.pixelRatio ?? pixelRatio
      if (e.data.useLayerEvents != null) useLayerEvents = e.data.useLayerEvents

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
      break

    case WorkerActionEnum.ADD_DRAWER:
      if (e.data.layerId != null && e.data.render != null) {
        drawers.set(e.data.layerId, {
          render: JSONfn.parse(e.data.render) as WorkerRender,
          data: e.data.data,
        })
        needsRedraw = true
      }
      break

    case WorkerActionEnum.REMOVE_DRAWER:
      drawers.delete(e.data.layerId!)
      needsRedraw = true
      break

    case WorkerActionEnum.UPDATE_DATA: {
      const layer = drawers.get(e.data.layerId!)
      if (layer) layer.data = e.data.data
      needsRedraw = true
      break
    }

    case WorkerActionEnum.GET_COLOR:
    case WorkerActionEnum.PICK_COLOR:
      if (offscreenCanvas && context) {
        try {
          self.postMessage({
            action,
            hex: pickColor(offscreenCanvas, context, e.data.x!, e.data.y!),
            x: e.data.x,
            y: e.data.y,
          })
        } catch {}
      }
      break

    case WorkerActionEnum.HIT_TEST:
      self.postMessage({
        action: WorkerActionEnum.HIT_TEST_RESULT,
        requestId: e.data.requestId,
        layerId: readHitLayerId(e.data.x ?? NaN, e.data.y ?? NaN),
      })
      break
  }
}

self.addEventListener('close', () => {
  if (frame !== null) cancelAnimationFrame(frame)
})
