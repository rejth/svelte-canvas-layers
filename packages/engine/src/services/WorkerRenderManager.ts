import JSONfn from 'json-fn'

import { type LayerId, WorkerActionEnum, type WorkerEvent, type WorkerRender } from '../layerTypes'

import type { HEX } from './colorPicking'
import Worker from './worker?worker'

/**
 * Main-thread manager for worker-mode rendering.
 */
export class WorkerRenderManager {
  width = 0
  height = 0
  pixelRatio = 1

  worker: Worker
  currentLayerId: LayerId

  onColor?: (action: WorkerActionEnum, hex: HEX, x: number, y: number) => void

  constructor() {
    this.worker = new Worker()
    this.currentLayerId = 1

    this.worker.onmessage = (e: MessageEvent<WorkerEvent>) => {
      const { action, hex, x, y } = e.data
      if (
        (action === WorkerActionEnum.GET_COLOR || action === WorkerActionEnum.PICK_COLOR) &&
        hex != null
      ) {
        this.onColor?.(action, hex, x ?? 0, y ?? 0)
      }
    }
  }

  /**
   * Creates the offscreen canvas, transfers it to the worker (ownership moves to the worker) and posts INIT.
   */
  init(canvas: HTMLCanvasElement) {
    const offscreen = canvas.transferControlToOffscreen()

    this.worker.postMessage(
      {
        action: WorkerActionEnum.INIT,
        canvas: offscreen,
        width: this.width,
        height: this.height,
        pixelRatio: this.pixelRatio,
      },
      [offscreen],
    )
  }

  /**
   * Registers a layer drawer.
   */
  register({ render, data }: { render: WorkerRender; data: unknown }) {
    const layerId = this.currentLayerId++

    this.worker.postMessage({
      action: WorkerActionEnum.ADD_DRAWER,
      layerId,
      render: JSONfn.stringify(render),
      data,
    })

    return {
      layerId,
      unregister: () => this.removeDrawer(layerId),
    }
  }

  /**
   * Removes a layer drawer.
   */
  removeDrawer(layerId: LayerId) {
    this.worker.postMessage({
      action: WorkerActionEnum.REMOVE_DRAWER,
      layerId,
    })
  }

  /**
   * Posts a granular per-layer data update — only the changed layer's `data` crosses the boundary; no render fn is re-serialized.
   */
  updateData(layerId: LayerId, data: unknown) {
    this.worker.postMessage({
      action: WorkerActionEnum.UPDATE_DATA,
      layerId,
      data,
    })
  }

  /**
   * Propagates size / pixel-ratio changes. No drawer payload is sent.
   */
  resize() {
    this.worker.postMessage({
      action: WorkerActionEnum.RESIZE,
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio,
    })
  }

  /**
   * Requests a peek read of the pixel at device-pixel (x, y). The HEX arrives
   * asynchronously via `onColor` with action GET_COLOR.
   */
  getColor(x: number, y: number) {
    this.worker.postMessage({
      action: WorkerActionEnum.GET_COLOR,
      x,
      y,
    })
  }

  /**
   * Requests a pick read of the pixel at device-pixel (x, y). The HEX arrives
   * asynchronously via `onColor` with action PICK_COLOR.
   */
  pick(x: number, y: number) {
    this.worker.postMessage({
      action: WorkerActionEnum.PICK_COLOR,
      x,
      y,
    })
  }

  destroy() {
    this.worker.terminate()
  }
}
