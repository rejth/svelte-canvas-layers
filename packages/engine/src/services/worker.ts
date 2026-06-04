import JSONfn from 'json-fn'

import { type LayerId, type WorkerEvent, type WorkerRender, WorkerActionEnum } from '../interfaces'

/**
 * In-worker render entry (WRK-03/WRK-04). Ported from color-dropper's `worker.ts`
 * with the two sanctioned Phase-4 improvements:
 *  - D-04: drawers receive the native `{ ctx, width, height, pixelRatio, data }` signature
 *    (the engine `Renderer` is out of scope inside the worker).
 *  - D-05: per-layer `data` is transported granularly; the drawer map keyed by layerId
 *    holds `{ render, data }` so UPDATE_DATA never re-serializes every render fn.
 */

let offscreenCanvas: OffscreenCanvas | null = null
let context: OffscreenCanvasRenderingContext2D | null = null
const drawers: Map<LayerId, { render: WorkerRender; data: unknown }> = new Map()

let width = 0
let height = 0
let pixelRatio = 1
let frame: number | null = null
let needsRedraw = true

/**
 * Offscreen canvas settings for rendering optimization (readiness for Phase-5 reads).
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

  // Re-apply the transform every redraw so a resize-driven pixelRatio change takes
  // effect (Pitfall 4 / WRK-04 — resizing the canvas resets its transform).
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)

  drawers.forEach(({ render: draw, data }) => {
    draw({ ctx: context!, width, height, pixelRatio, data })
  })

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

      // INIT may carry an initial batch of serialized drawers; WorkerLayer instances
      // also register after mount via ADD_DRAWER. Parse the same way ADD_DRAWER does.
      if (e.data.drawers) {
        const initial = JSONfn.parse(e.data.drawers) as Array<
          [LayerId, { render: WorkerRender; data: unknown }]
        >
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

      if (offscreenCanvas) {
        offscreenCanvas.width = width * pixelRatio
        offscreenCanvas.height = height * pixelRatio
      }

      needsRedraw = true
      break

    case WorkerActionEnum.ADD_DRAWER:
      // ADD_DRAWER must carry both a layerId and a serialized render source; a
      // payload missing either is malformed and is ignored rather than crashing.
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
  }
}

self.addEventListener('close', () => {
  if (frame !== null) cancelAnimationFrame(frame)
})
