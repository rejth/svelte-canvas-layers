import JSONfn from 'json-fn'

import { type LayerId, WorkerActionEnum, type WorkerRender } from '../interfaces'

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

  constructor() {
    this.worker = new Worker()
    this.currentLayerId = 1
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

  destroy() {
    this.worker.terminate()
  }
}
