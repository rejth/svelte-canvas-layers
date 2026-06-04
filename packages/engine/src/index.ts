// Public API barrel for @canvas/engine.
/// <reference path="./types.d.ts" />

export { KEY } from './constants'
export type {
  AppContext,
  BBox,
  BezierCurveDrawOptions,
  Bounds,
  CanvasContextType,
  CanvasEvents,
  CanvasOptions,
  CircleDrawOptions,
  ClearRectOptions,
  Dimension,
  HitCanvasRenderingContext2D,
  ImageDrawOptions,
  LayerEventDetails,
  LayerEventDispatcher,
  LayerEvents,
  OriginalEvent,
  PixelRatio,
  Point,
  QuadraticCurveDrawOptions,
  RectCorners,
  RectDimension,
  RectDrawOptions,
  RectPosition,
  RegisteredLayerMetadata,
  Render,
  RenderProps,
  ResizeEvent,
  RGB,
  RoundedRectDrawOptions,
  StrokeDrawOptions,
  TextDrawOptions,
  TransformationMatrix,
  WorkerAppContext,
  WorkerRender,
  WorkerRenderProps,
} from './interfaces'
// WorkerActionEnum is a runtime enum (value), so it is exported as a value — NOT
// inside the `export type` block above.
export { WorkerActionEnum } from './interfaces'
export { createHitCanvas } from './services/createHitCanvas'
export { getMaxPixelRatio } from './services/helpers'
export { LayerManager } from './services/LayerManager'
export { Renderer } from './services/Renderer'
export { WorkerRenderManager } from './services/WorkerRenderManager'
export { Canvas, Layer, WorkerCanvas, WorkerLayer } from './ui'
