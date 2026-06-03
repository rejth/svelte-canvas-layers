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
} from './interfaces'
export { createHitCanvas } from './services/createHitCanvas'
export { getMaxPixelRatio } from './services/helpers'
export { LayerManager } from './services/LayerManager'
export { Renderer } from './services/Renderer'
export { Canvas, Layer } from './ui'
