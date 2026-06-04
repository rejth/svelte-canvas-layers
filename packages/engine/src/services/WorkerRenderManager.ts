import JSONfn from 'json-fn'

import Worker from './worker?worker'

import { type LayerId, type WorkerRender, WorkerActionEnum } from '../interfaces'

/**
 * Main-thread manager for worker-mode rendering (WRK-01/WRK-02).
 *
 * Ported from color-dropper's `RenderWorker.ts` + the engine `LayerManager` id-counter
 * pattern, with the two sanctioned Phase-4 improvements:
 *  - D-04: render fns are serialized once per layer at registration; the color-source
 *    field from the analog is dropped (Phase-5 boundary).
 *  - D-05: per-layer `data` updates post a granular `UPDATE_DATA` instead of
 *    re-stringifying the whole drawer map. There is intentionally no writable-store
 *    drawer subscription and no whole-map re-serialize blob from the analog.
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
   * Creates the offscreen canvas, transfers it to the worker (ownership moves to the
   * worker) and posts INIT. The transfer list `[offscreen]` is REQUIRED (Pitfall 3).
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
   * Registers a layer drawer. The render SOURCE is serialized once with json-fn
   * (WRK-02/D-05); dynamic state must be routed through `data` (structured clone).
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

  removeDrawer(layerId: LayerId) {
    this.worker.postMessage({ action: WorkerActionEnum.REMOVE_DRAWER, layerId })
  }

  /**
   * Posts a granular per-layer data update (D-05) — only the changed layer's `data`
   * crosses the boundary; no render fn is re-serialized.
   */
  updateData(layerId: LayerId, data: unknown) {
    this.worker.postMessage({ action: WorkerActionEnum.UPDATE_DATA, layerId, data })
  }

  /**
   * Propagates size / pixel-ratio changes (WRK-04). No drawer payload is sent.
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
