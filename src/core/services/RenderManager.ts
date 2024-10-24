import RBush from 'rbush';
import type {
  HitCanvasRenderingContext2D,
  OriginalEvent,
  Render,
  LayerId,
  LayerEventDetails,
  CanvasEvents,
  LayerEventDispatcher,
  RegisteredLayerMetadata,
  CanvasContextType,
  LayerBBox,
} from 'core/interfaces';
import { geometryManager, type Renderer } from 'core/services';

export class RenderManager {
  renderer: Renderer;

  currentLayerId: LayerId;
  activeLayerId: LayerId;
  layerSequence: LayerId[];
  layerContainer: HTMLDivElement | null;
  layerObserver: MutationObserver | null;

  tree: RBush<LayerBBox>;
  visibleLayers: Array<LayerBBox>;
  visibleLayerIds: Array<LayerId>;
  drawers: Map<LayerId, { layerBBox: LayerBBox; render: Render }>;
  dispatchers: Map<LayerId, LayerEventDispatcher>;
  needsRedraw: boolean;

  animationFrame?: number;
  layerChangeCallback?: (layerId: LayerId) => void;

  constructor(renderer: Renderer) {
    this.renderer = renderer;

    this.currentLayerId = 1;
    this.activeLayerId = 0;
    this.layerSequence = [];
    this.layerContainer = null;
    this.layerObserver = null;

    this.tree = new RBush();
    this.visibleLayers = [];
    this.visibleLayerIds = [];
    this.drawers = new Map();
    this.dispatchers = new Map();
    this.needsRedraw = true;

    this.redraw = this.redraw.bind(this);
  }

  getContext(): CanvasContextType | null {
    return this.renderer.getContext();
  }

  getRenderer(): Renderer {
    return this.renderer;
  }

  run(layerContainer: HTMLDivElement) {
    this.layerContainer = layerContainer;
    this.#observeLayerSequence();

    this.tree.clear();
    const layerBBoxes = this.layerSequence.map((layerId) => this.drawers.get(layerId)!.layerBBox);
    this.tree.load(layerBBoxes);

    const transformedArea = this.renderer.getTransformedArea();

    if (transformedArea) {
      const transformedBBox = geometryManager.convertRectToBBox(transformedArea!);
      this.visibleLayers = this.tree.search(transformedBBox);
    }

    this.#startRenderLoop();
  }

  #startRenderLoop() {
    this.#render();
    this.animationFrame = requestAnimationFrame(() => this.#startRenderLoop());
  }

  #observeLayerSequence() {
    this.layerObserver = new MutationObserver(() => this.#getLayerSequence());
    this.layerObserver.observe(this.layerContainer!, { childList: true });
    this.#getLayerSequence();
  }

  #getLayerSequence() {
    const layers = <HTMLElement[]>[...this.layerContainer!.children];
    this.layerSequence = layers.map((layer) => +layer.dataset.layerId!);
    this.searchVisibleLayers();
  }

  register({ render, dispatcher, bounds }: RegisteredLayerMetadata) {
    const layerId = this.currentLayerId;
    const bbox = geometryManager.getBBox(bounds);
    const layerBBox = { layerId, ...bbox };

    this.tree.insert(layerBBox);
    this.#addDrawer(layerId, { layerBBox, render });

    if (dispatcher) {
      this.#addDispatcher(layerId, dispatcher);
    }

    this.redraw();

    return {
      unregister: () => this.#unregister(layerId),
      layerId: this.currentLayerId++,
    };
  }

  #unregister(layerId: LayerId) {
    this.#removeDrawer(layerId);
    this.#removeDispatcher(layerId);
    this.redraw();
  }

  #addDrawer(layerId: LayerId, layerData: { layerBBox: LayerBBox; render: Render }) {
    this.drawers.set(layerId, layerData);
  }

  #addDispatcher(layerId: LayerId, dispatcher: LayerEventDispatcher) {
    this.dispatchers.set(layerId, dispatcher);
  }

  #removeDrawer(layerId: LayerId) {
    const { layerBBox } = this.drawers.get(layerId) || {};

    if (layerBBox) {
      this.tree.remove(layerBBox, (a, b) => a.layerId === b.layerId);
    }

    this.drawers.delete(layerId);
  }

  #removeDispatcher(layerId: LayerId) {
    this.dispatchers.delete(layerId);
  }

  /**
   * The main render function which is responsible for drawing, clearing and canvas's transformation matrix adjustment.
   * Renders the canvas only when width, height or pixelRatio change.
   * */
  #render() {
    if (!this.needsRedraw) return;

    const context = this.renderer.getContext()!;
    const options = this.renderer.getCanvasOptions();
    const transformedArea = this.renderer.getTransformedArea();

    if (transformedArea) {
      this.renderer.clearRectSync(transformedArea);
    }

    for (const layerId of this.visibleLayerIds) {
      const { render } = this.drawers.get(layerId) || {};
      this.layerChangeCallback?.(layerId);
      render?.({ context, options });
    }

    this.needsRedraw = false;
  }

  searchVisibleLayers() {
    const transformedArea = this.renderer.getTransformedArea();

    if (transformedArea) {
      const transfromedBBox = geometryManager.convertRectToBBox(transformedArea);
      this.visibleLayers = this.tree.search(transfromedBBox);
      this.visibleLayerIds = this.layerSequence.slice(0, this.visibleLayers.length);
    }

    this.needsRedraw = true;
  }

  /**
   * Forces canvas's transformation matrix adjustment to scale drawings according to the new width, height or device's pixel ratio.
   */
  redraw() {
    this.needsRedraw = true;
  }

  /**
   * Handles "mousemove", "pointermove" and "touchstart" events on the canvas to identify the layer.
   * Then re-dispatch the events to the Layer component and sets the active layer.
   */

  findActiveLayer(e: OriginalEvent) {
    const context = this.renderer.getContext();
    const point = geometryManager.calculatePosition(e);
    const layerId = (<HitCanvasRenderingContext2D>context).getLayerIdAt(point.x, point.y);

    if (this.activeLayerId === layerId) return;

    if (e instanceof MouseEvent) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerleave', e),
        ...point,
      });
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseleave', e),
        ...point,
      });
    }

    this.activeLayerId = layerId;

    if (e instanceof MouseEvent) {
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerenter', e),
        ...point,
      });
      this.#dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseenter', e),
        ...point,
      });
    }
  }

  /**
   * Handles events on the canvas and then re-dispatch the events to the corresponding layer
   */
  dispatchEvent(e: OriginalEvent) {
    if (!this.activeLayerId) return;
    const point = geometryManager.calculatePosition(e);
    this.#dispatchLayerEvent(this.activeLayerId, { originalEvent: e, ...point });
  }

  /**
   * Dispatches events to the Layer component.
   */
  #dispatchLayerEvent(layerId: LayerId, details: LayerEventDetails) {
    const dispatch = this.dispatchers.get(layerId);
    dispatch?.(<CanvasEvents>details.originalEvent.type, details);
  }

  onLayerChange(callback: (layerId: LayerId) => void) {
    this.layerChangeCallback = callback;
  }

  destroy() {
    if (typeof window === 'undefined') return;

    this.layerObserver?.disconnect();
    cancelAnimationFrame(this.animationFrame!);
  }
}
