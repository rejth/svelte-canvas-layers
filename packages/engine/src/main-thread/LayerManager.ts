import { pickColor } from '../common/colorPicking'
import { calculatePosition } from '../common/geometry'
import type {
  CanvasEvents,
  LayerEventDetails,
  LayerEventDispatcher,
  LayerId,
  OriginalEvent,
} from '../common/types'

import type { Renderer } from './Renderer'
import type {
  CanvasContextType,
  HitCanvasRenderingContext2D,
  RegisteredLayerMetadata,
  Render,
} from './types'

export class LayerManager {
  renderer: Renderer
  currentLayerId: LayerId
  activeLayerId: LayerId
  layerSequence: LayerId[]
  layerContainer: HTMLDivElement | null
  layerObserver: MutationObserver | null

  drawers: Map<LayerId, { render: Render }>
  dispatchers: Map<LayerId, LayerEventDispatcher>
  needsRedraw: boolean

  animationFrame?: number
  layerChangeCallback?: (layerId: LayerId) => void

  constructor(renderer: Renderer) {
    this.renderer = renderer

    this.currentLayerId = 1
    this.activeLayerId = 0
    this.layerSequence = []
    this.layerContainer = null
    this.layerObserver = null

    this.drawers = new Map()
    this.dispatchers = new Map()
    this.needsRedraw = true

    this.redraw = this.redraw.bind(this)
  }

  getContext(): CanvasContextType | null {
    return this.renderer.getContext()
  }

  getRenderer(): Renderer {
    return this.renderer
  }

  run(layerContainer: HTMLDivElement) {
    this.layerContainer = layerContainer
    this.#observeLayerSequence()
    this.#startRenderLoop()
  }

  #startRenderLoop() {
    this.#render()
    this.animationFrame = requestAnimationFrame(() => this.#startRenderLoop())
  }

  #observeLayerSequence() {
    this.layerObserver = new MutationObserver(() => this.#getLayerSequence())
    this.layerObserver.observe(this.layerContainer!, { childList: true })
    this.#getLayerSequence()
  }

  #getLayerSequence() {
    const layers = <HTMLElement[]>[...this.layerContainer!.children]
    this.layerSequence = layers.map((layer) => +layer.dataset.layerId!)
  }

  register({ render, dispatcher }: RegisteredLayerMetadata) {
    const layerId = this.currentLayerId
    this.#addDrawer(layerId, { render })

    if (dispatcher) {
      this.#addDispatcher(layerId, dispatcher)
    }

    this.redraw()

    return {
      unregister: () => this.#unregister(layerId),
      layerId: this.currentLayerId++,
    }
  }

  update(layerId: LayerId, { render }: RegisteredLayerMetadata) {
    const drawer = this.drawers.get(layerId)
    if (!drawer) return

    drawer.render = render
    this.redraw()
  }

  #unregister(layerId: LayerId) {
    this.#removeDrawer(layerId)
    this.#removeDispatcher(layerId)
    this.redraw()
  }

  #addDrawer(layerId: LayerId, layerData: { render: Render }) {
    this.drawers.set(layerId, layerData)
  }

  #addDispatcher(layerId: LayerId, dispatcher: LayerEventDispatcher) {
    this.dispatchers.set(layerId, dispatcher)
  }

  #removeDrawer(layerId: LayerId) {
    this.drawers.delete(layerId)
  }

  #removeDispatcher(layerId: LayerId) {
    this.dispatchers.delete(layerId)
  }

  /**
   * The main render function which is responsible for drawing, clearing and canvas's transformation matrix adjustment.
   * Renders the canvas only when width, height or pixelRatio change.
   * */
  #render() {
    if (!this.needsRedraw) return

    const ctx = this.renderer.getContext()!
    const transformedArea = this.renderer.getTransformedArea()

    if (transformedArea) {
      this.renderer.clearRectSync(transformedArea)
    }

    for (const layerId of this.layerSequence) {
      const { render } = this.drawers.get(layerId) || {}
      this.layerChangeCallback?.(layerId)
      render?.({ ctx, renderer: this.renderer })
    }

    this.needsRedraw = false
  }

  /**
   * Forces canvas's transformation matrix adjustment to scale drawings according to the new width, height or device's pixel ratio.
   */
  redraw() {
    this.needsRedraw = true
  }

  /**
   * Read the pixel color at device-pixel `(x, y)` off the display canvas.
   */
  pickColor(x: number, y: number): string | null {
    const ctx = this.renderer.getContext()
    if (!ctx) return null

    const context = ctx as unknown as CanvasRenderingContext2D

    try {
      const px = Math.floor(x)
      const py = Math.floor(y)
      if (px < 0 || py < 0 || px >= context.canvas.width || py >= context.canvas.height) {
        return null
      }

      return pickColor(context, x, y)
    } catch {
      return null
    }
  }

  /**
   * Handles "mousemove", "pointermove" and "touchstart" events on the canvas to identify the layer.
   * Then re-dispatch the events to the Layer component and sets the active layer.
   */

  findActiveLayer(e: OriginalEvent) {
    const context = this.renderer.getContext()
    const point = calculatePosition(e)
    const layerId = (<HitCanvasRenderingContext2D>context).getLayerIdAt(point.x, point.y)

    if (this.activeLayerId === layerId) return

    if (e instanceof MouseEvent) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerleave', e),
        ...point,
      })
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseleave', e),
        ...point,
      })
    }

    this.activeLayerId = layerId

    if (e instanceof MouseEvent) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerenter', e),
        ...point,
      })
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseenter', e),
        ...point,
      })
    }
  }

  /**
   * Handles events on the canvas and then re-dispatch the events to the corresponding layer
   */
  dispatchEvent(e: OriginalEvent) {
    if (!this.activeLayerId) return
    const point = calculatePosition(e)
    this.#dispatchLayerEvent(this.activeLayerId, { originalEvent: e, ...point })
  }

  /**
   * Dispatches events to the Layer component.
   */
  #dispatchLayerEvent(layerId: LayerId, details: LayerEventDetails) {
    const dispatch = this.dispatchers.get(layerId)
    dispatch?.(<CanvasEvents>details.originalEvent.type, details)
  }

  leaveActiveLayer(e: CustomEvent | OriginalEvent) {
    this.#dispatchLayerEvent(this.activeLayerId, {
      originalEvent: new PointerEvent('pointerleave', e),
      ...{ x: 0, y: 0 },
    })
    this.#dispatchLayerEvent(this.activeLayerId, {
      originalEvent: new MouseEvent('mouseleave', e),
      ...{ x: 0, y: 0 },
    })
  }

  onLayerChange(callback: (layerId: LayerId) => void) {
    this.layerChangeCallback = callback
  }

  destroy() {
    if (typeof window === 'undefined') return
    this.layerObserver?.disconnect()
    cancelAnimationFrame(this.animationFrame!)
  }
}
