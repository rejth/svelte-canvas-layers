import JSONfn from 'json-fn'

import type { HEX } from '../common/colorPicking'
import type {
  CanvasEvents,
  LayerEventDetails,
  LayerEventDispatcher,
  LayerId,
  OriginalEvent,
  Point,
} from '../common/types'

import { WorkerActionEnum, type WorkerEvent, type WorkerRender } from './types'

/**
 * A hit-test request awaiting its async `HIT_TEST_RESULT`. The original DOM event
 * is held here on the main thread only — it is never serialized to the
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

  onColor?: (hex: HEX, x: number, y: number) => void

  // Main-thread layer-event state.
  useLayerEvents = false
  activeLayerId: LayerId = 0
  currentRequestId = 1
  latestCoalescableRequestId = 0
  dispatchers: Map<LayerId, LayerEventDispatcher> = new Map()
  pendingHitEvents: Map<number, PendingHitEvent> = new Map()
  capturedLayerId: LayerId = 0
  layerSequence: LayerId[] = []
  layerContainer: HTMLDivElement | null = null
  layerObserver: MutationObserver | null = null

  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    this.currentLayerId = 1

    this.worker.onmessage = (e: MessageEvent<WorkerEvent>) => {
      const { action, hex, x, y, requestId, layerId } = e.data

      if (action === WorkerActionEnum.HIT_TEST_RESULT) {
        this.#handleHitTestResult(requestId, layerId ?? 0)
        return
      }

      if (action === WorkerActionEnum.PICK_COLOR && hex != null) {
        this.onColor?.(hex, x ?? 0, y ?? 0)
      }
    }
  }

  /**
   * Creates the offscreen canvas, transfers it to the worker (ownership moves to the worker) and posts INIT.
   *
   * The initial `useLayerEvents` flag is carried in the INIT message so the worker's
   * resident hit canvas state is deterministic before any early hit-test traffic.
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
   * hit-test results can be re-dispatched as layer events on the owning WorkerLayer.
   */
  register({
    render,
    data,
    dispatcher,
  }: {
    render: WorkerRender
    data: unknown
    dispatcher?: LayerEventDispatcher
  }) {
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

  observeLayerSequence(layerContainer: HTMLDivElement) {
    this.layerContainer = layerContainer
    this.layerObserver = new MutationObserver(() => this.#setLayerSequenceFromDom())
    this.layerObserver.observe(layerContainer, { childList: true })
    this.#setLayerSequenceFromDom()
  }

  /**
   * Removes a layer drawer, its dispatcher, and clears active-layer state when the
   * removed layer was active so stale results cannot be dispatched.
   */
  removeDrawer(layerId: LayerId) {
    this.dispatchers.delete(layerId)
    if (this.activeLayerId === layerId) this.activeLayerId = 0
    if (this.capturedLayerId === layerId) this.capturedLayerId = 0

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

  #setLayerSequenceFromDom() {
    if (!this.layerContainer) return

    const layers = [...this.layerContainer.children] as HTMLElement[]
    this.layerSequence = layers.map((layer) => +layer.dataset.layerId!).filter(Boolean)

    this.worker.postMessage({
      action: WorkerActionEnum.SET_LAYER_SEQUENCE,
      layerSequence: this.layerSequence,
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
   * Requests a click pick read of the pixel at device-pixel (x, y). The HEX
   * arrives asynchronously via `onColor`.
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
   * disabled after the initial INIT flag.
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
   * Requests an async hit-test. The original DOM event is stored on the main thread;
   * only `{ requestId, x, y }` crosses the worker boundary. Coalescable
   * move/hover requests are tracked so stale results can be dropped.
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
    const targetLayerId = this.capturedLayerId || this.activeLayerId
    if (!targetLayerId) return
    if (!this.dispatchers.has(targetLayerId)) return

    this.#dispatchLayerEvent(targetLayerId, { originalEvent, ...detailPoint })

    if (this.#isReleaseEvent(originalEvent)) {
      this.capturedLayerId = 0
    }
  }

  /**
   * Synthesizes leave events for the active layer and resets active state. Called on
   * pointer/touch cancellation or when the active layer leaves the canvas.
   */
  leaveActiveLayer(originalEvent: OriginalEvent, detailPoint: Point = { x: 0, y: 0 }) {
    if (originalEvent instanceof MouseEvent && originalEvent.buttons > 0) return
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

    // Drop stale coalescable (move/hover) responses superseded by a newer request.
    if (pending.coalescable && requestId !== this.latestCoalescableRequestId) return

    if (pending.shouldFindActiveLayer) {
      if (layerId !== 0 && !this.dispatchers.has(layerId)) return
      this.#setActiveLayer(layerId, pending.originalEvent, pending.detailPoint)
      if (this.#isPressEvent(pending.originalEvent)) {
        this.capturedLayerId = layerId
      }
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
   * enter events to the new one.
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
   * type, preserving the existing `LayerEventDetails` shape.
   */
  #dispatchLayerEvent(layerId: LayerId, details: LayerEventDetails) {
    const dispatch = this.dispatchers.get(layerId)
    dispatch?.(details.originalEvent.type as CanvasEvents, details)
  }

  #isPressEvent(originalEvent: OriginalEvent) {
    return originalEvent.type === 'mousedown' || originalEvent.type === 'pointerdown'
  }

  #isReleaseEvent(originalEvent: OriginalEvent) {
    return (
      originalEvent.type === 'mouseup' ||
      originalEvent.type === 'pointerup' ||
      originalEvent.type === 'pointercancel' ||
      originalEvent.type === 'touchend' ||
      originalEvent.type === 'touchcancel'
    )
  }

  destroy() {
    this.layerObserver?.disconnect()
    this.worker.terminate()
  }
}
