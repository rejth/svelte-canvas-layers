import type { createEventDispatcher } from 'svelte'

import type { LayerManager, Renderer } from './services'
import type { WorkerRenderManager } from './services/WorkerRenderManager'

export type AppContext = {
  layerManager: LayerManager
}

export type CanvasContextType = CanvasRenderingContext2D | HitCanvasRenderingContext2D

export type LayerId = number
export type Point = Pick<DOMRect, 'x' | 'y'>
export type Dimension = Pick<DOMRect, 'width' | 'height'>
export type RectPosition = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>
export type RectDimension = Point & Dimension

export type BBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type RectCorners = {
  topLeft: Point
  topRight: Point
  bottomLeft: Point
  bottomRight: Point
}

export type PixelRatio = number
export type Bounds = { x0: number; y0: number; x1: number; y1: number }
export type RGB = [number, number, number]

export interface HitCanvasRenderingContext2D extends Omit<CanvasRenderingContext2D, 'canvas'> {
  getLayerIdAt: (x: number, y: number) => number
  setActiveLayerId: (id: LayerId) => void
}

export type CanvasOptions = {
  width: number
  height: number
  initialPixelRatio: PixelRatio
  pixelRatio: PixelRatio
}

export type RenderProps = {
  ctx: CanvasContextType
  renderer: Renderer
}

export interface Render {
  (data: RenderProps): void
}

/**
 * Worker render contract (D-04).
 * Unlike the main-thread `Render`, the worker render fn receives the native
 * `OffscreenCanvasRenderingContext2D` directly — NOT the engine `Renderer` —
 * because the render source is serialized via json-fn and reconstructed inside
 * the worker, where the engine `Renderer` instance is not in scope.
 */
export type WorkerRenderProps<T = unknown> = {
  ctx: OffscreenCanvasRenderingContext2D
  width: number
  height: number
  pixelRatio: number
  data: T
}

export interface WorkerRender<T = unknown> {
  (props: WorkerRenderProps<T>): void
}

/**
 * Worker app-context (D-05), provided under WORKER_KEY (distinct from KEY so a
 * WorkerLayer under a main-thread <Canvas> finds no worker context).
 */
export type WorkerAppContext = {
  workerManager: WorkerRenderManager
}

/**
 * Worker message-action enum (D-05/D-07). Mirrors color-dropper's WorkerActionEnum
 * minus the Phase-5 color-picking members, and replaces the single UPDATE with the
 * granular ADD_DRAWER/REMOVE_DRAWER/UPDATE_DATA actions.
 */
export enum WorkerActionEnum {
  INIT = 'init',
  RESIZE = 'resize',
  ADD_DRAWER = 'addDrawer',
  REMOVE_DRAWER = 'removeDrawer',
  UPDATE_DATA = 'updateData',
}

/**
 * Worker postMessage payload shape. Mirrors color-dropper's WorkerEvent minus the
 * color-picking fields (imageSource / cursorPosition / color — Phase 5 scope).
 */
export type WorkerEvent = {
  action: WorkerActionEnum
  canvas?: OffscreenCanvas
  drawers?: string
  render?: string
  data?: unknown
  layerId?: LayerId
  width?: number
  height?: number
  pixelRatio?: number
}

export interface RegisteredLayerMetadata {
  render: Render
  dispatcher?: LayerEventDispatcher
  bounds?: Bounds
}

export type OriginalEvent = MouseEvent | TouchEvent

export type ResizeEvent = {
  resize: {
    width: number
    height: number
    pixelRatio: PixelRatio
  }
}

export type CanvasEvents =
  | 'click'
  | 'dblclick'
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
  | 'pointerleave'

export type LayerEvents = Record<CanvasEvents, LayerEventDetails>
export type LayerEventDispatcher = ReturnType<typeof createEventDispatcher<LayerEvents>>
export type LayerEventDetails = Point & { originalEvent: OriginalEvent }

export interface RectDrawOptions {
  x: number
  y: number
  width: number
  height: number
  color?: string
  shadowColor?: string
  shadowOffsetY?: number
  shadowOffsetX?: number
  shadowBlur?: number
}

export interface RoundedRectDrawOptions {
  x: number
  y: number
  width: number
  height: number
  radius: number
  color: string
  shadowColor?: string
  shadowOffsetY?: number
  shadowOffsetX?: number
  shadowBlur?: number
}

export interface StrokeDrawOptions {
  x: number
  y: number
  width: number
  height: number
  lineWidth: number
  color: string
}

export interface CircleDrawOptions {
  x: number
  y: number
  radius: number
  color: string
}

export interface QuadraticCurveDrawOptions {
  start: Point
  control: Point
  end: Point
  color: string
  lineWidth: number
}

export interface BezierCurveDrawOptions {
  start: Point
  cp1: Point
  cp2: Point
  end: Point
  color: string
  lineWidth: number
}

export interface ImageDrawOptions {
  image: CanvasImageSource
  x: number
  y: number
  width: number
  height: number
}

export interface TextDrawOptions {
  text: string
  font: string
  fontSize: number
  fontStyle: string
  textAlign: CanvasTextAlign
  textDecoration: string
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export interface BackgroundPatternRendererData {
  ctx: OffscreenCanvasRenderingContext2D
}

export interface BackgroundPatternRenderer {
  (data: BackgroundPatternRendererData): void
}

export interface TransformationMatrix {
  translationX: number
  translationY: number
  scaleX: number
  scaleY: number
  skewY: number
  skewX: number
  initialScale: number
}

export interface ClearRectOptions {
  x: number
  y: number
  width: number
  height: number
}
