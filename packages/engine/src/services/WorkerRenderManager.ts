/// <reference path="../json-fn.d.ts" />

import JSONfn from 'json-fn'

import {
  type CanvasEvents,
  type LayerEventDetails,
  type LayerEventDispatcher,
  type LayerId,
  type OriginalEvent,
  type Point,
  WorkerActionEnum,
  type WorkerEvent,
  type WorkerRender,
} from '../layerTypes'

import type { HEX } from './colorPicking'
import Worker from './worker?worker'

/**
 * A hit-test request awaiting its async `HIT_TEST_RESULT`. The original DOM event
 * is held here on the main thread only (D-10) — it is never serialized to the
 * worker, which receives just `{ requestId, x, y }`.
 */
interface PendingHitEvent {
  originalEvent: OriginalEvent
  detailPoint: Point
  shouldFindActiveLayer: boolean
  shouldDispatchOriginal: boolean
  coalescable: boolean
}

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

  // Main-thread layer-event state (D-01/D-03/D-05/D-10).
  useLayerEvents = false
  activeLayerId: LayerId = 0
  currentRequestId = 1
  latestCoalescableRequestId = 0
  dispatchers: Map<LayerId, LayerEventDispatcher> = new Map()
  pendingHitEvents: Map<number, PendingHitEvent> = new Map()

  constructor() {
    this.worker = new Worker()
    this.currentLayerId = 1

    this.worker.onmessage = (e: MessageEvent<WorkerEvent>) => {
      const { action, hex, x, y, requestId, layerId } = e.data

      // Hit-test results are routed independently from color picking (D-07).
      if (action === WorkerActionEnum.HIT_TEST_RESULT) {
        this.#handleHitTestResult(requestId, layerId ?? 0)
        return
      }

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
   *
   * The initial `useLayerEvents` flag is carried in the INIT message so the worker's
   * resident hit canvas state is deterministic before any early hit-test traffic (D-06/D-08).
   */
  init(canvas: HTMLCanvasElement, options: { useLayerEvents?: boolean } = {}) {
    this.useLayerEvents = options.useLayerEvents ?? false
    const offscreen = canvas.transferControlToOffscreen()

    this.worker.postMessage(
      {
        action: WorkerActionEnum.INIT,
        canvas: offscreen,
        width: this.width,
        height: this.height,
        pixelRatio: this.pixelRatio,
        useLayerEvents: this.useLayerEvents,
      },
      [offscreen],
    )
  }

  /**
   * Registers a layer drawer. An optional Svelte `dispatcher` is stored so worker
   * hit-test results can be re-dispatched as layer events on the owning WorkerLayer (D-03).
   */
  register({
    render,
    data,
    dispatcher,
  }: { render: WorkerRender; data: unknown; dispatcher?: LayerEventDispatcher }) {
    const layerId = this.currentLayerId++

    if (dispatcher) {
      this.dispatchers.set(layerId, dispatcher)
    }

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
   * Removes a layer drawer, its dispatcher, and clears active-layer state when the
   * removed layer was active so stale results cannot be dispatched (T-07-02-REPLAY).
   */
  removeDrawer(layerId: LayerId) {
    this.dispatchers.delete(layerId)
    if (this.activeLayerId === layerId) this.activeLayerId = 0

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

  /**
   * Toggles worker layer events after init. Stores the flag and forwards it to the
   * worker via a RESIZE message so Plan 01's resident hit canvas can be enabled or
   * disabled after the initial INIT flag (D-06/D-08).
   */
  setUseLayerEvents(useLayerEvents: boolean) {
    if (this.useLayerEvents === useLayerEvents) return
    this.useLayerEvents = useLayerEvents

    this.worker.postMessage({
      action: WorkerActionEnum.RESIZE,
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio,
      useLayerEvents,
    })
  }

  /**
   * Requests an async hit-test. The original DOM event is stored on the main thread
   * (D-10); only `{ requestId, x, y }` crosses the worker boundary. Coalescable
   * move/hover requests are tracked so stale results can be dropped (D-05).
   */
  requestLayerEvent({
    originalEvent,
    hitPoint,
    detailPoint,
    shouldFindActiveLayer,
    shouldDispatchOriginal,
    coalescable,
  }: {
    originalEvent: OriginalEvent
    hitPoint: Point
    detailPoint: Point
    shouldFindActiveLayer: boolean
    shouldDispatchOriginal: boolean
    coalescable: boolean
  }) {
    const requestId = this.currentRequestId++

    this.pendingHitEvents.set(requestId, {
      originalEvent,
      detailPoint,
      shouldFindActiveLayer,
      shouldDispatchOriginal,
      coalescable,
    })

    if (coalescable) this.latestCoalescableRequestId = requestId

    this.worker.postMessage({
      action: WorkerActionEnum.HIT_TEST,
      requestId,
      x: hitPoint.x,
      y: hitPoint.y,
    })
  }

  /**
   * Dispatches an event to the current active layer without a new hit-test. Used by
   * drag move/up paths that should route to the layer already under capture. No-ops
   * when there is no active layer or it has no dispatcher.
   */
  dispatchCurrentLayerEvent(originalEvent: OriginalEvent, detailPoint: Point) {
    if (!this.activeLayerId) return
    if (!this.dispatchers.has(this.activeLayerId)) return
    this.#dispatchLayerEvent(this.activeLayerId, { originalEvent, ...detailPoint })
  }

  /**
   * Synthesizes leave events for the active layer and resets active state. Called on
   * pointer/touch cancellation or when the active layer leaves the canvas.
   */
  leaveActiveLayer(originalEvent: OriginalEvent, detailPoint: Point = { x: 0, y: 0 }) {
    if (!this.activeLayerId) return

    if (originalEvent instanceof MouseEvent) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerleave', originalEvent),
        ...detailPoint,
      })
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseleave', originalEvent),
        ...detailPoint,
      })
    }

    this.activeLayerId = 0
  }

  /**
   * Routes a hit-test result back to the owning layer. Drops missing/stale requests,
   * updates active-layer enter/leave state, then dispatches the original event.
   */
  #handleHitTestResult(requestId: number | undefined, layerId: LayerId) {
    if (requestId == null) return

    const pending = this.pendingHitEvents.get(requestId)
    if (!pending) return
    this.pendingHitEvents.delete(requestId)

    // Drop stale coalescable (move/hover) responses superseded by a newer request (D-05).
    if (pending.coalescable && requestId !== this.latestCoalescableRequestId) return

    if (pending.shouldFindActiveLayer) {
      this.#setActiveLayer(layerId, pending.originalEvent, pending.detailPoint)
    }

    if (pending.shouldDispatchOriginal) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: pending.originalEvent,
        ...pending.detailPoint,
      })
    }
  }

  /**
   * Mirrors `LayerManager.findActiveLayer`: when the active layer changes and the
   * source is a MouseEvent, dispatch synthetic leave events to the old layer and
   * enter events to the new one (D-04/D-09).
   */
  #setActiveLayer(layerId: LayerId, originalEvent: OriginalEvent, detailPoint: Point) {
    if (this.activeLayerId === layerId) return

    if (originalEvent instanceof MouseEvent) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerleave', originalEvent),
        ...detailPoint,
      })
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseleave', originalEvent),
        ...detailPoint,
      })
    }

    this.activeLayerId = layerId

    if (originalEvent instanceof MouseEvent) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerenter', originalEvent),
        ...detailPoint,
      })
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseenter', originalEvent),
        ...detailPoint,
      })
    }
  }

  /**
   * Dispatches a layer event to the registered dispatcher using the original event's
   * type, preserving the existing `LayerEventDetails` shape (D-09).
   */
  #dispatchLayerEvent(layerId: LayerId, details: LayerEventDetails) {
    const dispatch = this.dispatchers.get(layerId)
    dispatch?.(details.originalEvent.type as CanvasEvents, details)
  }

  destroy() {
    this.worker.terminate()
  }
}
