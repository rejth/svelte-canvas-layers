import type { createEventDispatcher } from 'svelte';
import type { GeometryManager, RenderManager } from './index';

export type AppContext = {
  renderManager: RenderManager;
};

export type LayerId = number;
export type Point = Pick<DOMRect, 'x' | 'y'>;
export type Dimension = Pick<DOMRect, 'width' | 'height'>;
export type RectPosition = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>;
export type RectDimension = Point & Dimension;

export type Bounds = { x0: number; y0: number; x1: number; y1: number };
export type RGB = [number, number, number];

export interface HitCanvasRenderingContext2D extends Omit<CanvasRenderingContext2D, 'canvas'> {
  getLayerIdAt: (x: number, y: number) => number;
  setActiveLayerId: (id: LayerId) => void;
}

export type RenderProps = {
  ctx: HitCanvasRenderingContext2D;
  geometry: GeometryManager;
};

export interface Render {
  (props: RenderProps): void;
}

export type OriginalEvent = MouseEvent | TouchEvent;

export type CanvasEvents =
  | 'click'
  | 'contextmenu'
  | 'wheel'
  | 'mousedown'
  | 'mousemove'
  | 'mouseup'
  | 'mouseenter'
  | 'mouseleave'
  | 'touchstart'
  | 'touchmove'
  | 'touchend'
  | 'touchcancel'
  | 'pointerdown'
  | 'pointermove'
  | 'pointerup'
  | 'pointercancel'
  | 'pointerenter'
  | 'pointerleave';

export type LayerEvents = Record<CanvasEvents, LayerEventDetails>;
export type LayerEventDispatcher = ReturnType<typeof createEventDispatcher<LayerEvents>>;
export type LayerEventDetails = Point & { originalEvent: OriginalEvent };
