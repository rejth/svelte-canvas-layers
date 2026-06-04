import JSONfn from 'json-fn'

import { type LayerId, WorkerActionEnum, type WorkerEvent, type WorkerRender } from '../layerTypes'

import { pickColor } from './colorPicking'

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

      if (offscreenCanvas) {
        offscreenCanvas.width = width * pixelRatio
        offscreenCanvas.height = height * pixelRatio
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
  }
}

self.addEventListener('close', () => {
  if (frame !== null) cancelAnimationFrame(frame)
})
