// Public API barrel for @canvas/engine.
export { Canvas, Layer } from './ui'
export { LayerManager } from './services/LayerManager'
export { Renderer } from './services/Renderer'
export { createHitCanvas } from './services/createHitCanvas'
export { getMaxPixelRatio } from './services/helpers'

export type {
  AppContext,
  Bounds,
  Point,
  Dimension,
  RectPosition,
  RectDimension,
  RectCorners,
  BBox,
  PixelRatio,
  RGB,
  CanvasContextType,
  HitCanvasRenderingContext2D,
  CanvasOptions,
  Render,
  RenderProps,
  RegisteredLayerMetadata,
  OriginalEvent,
  ResizeEvent,
  CanvasEvents,
  LayerEvents,
  LayerEventDispatcher,
  LayerEventDetails,
  TransformationMatrix,
  RectDrawOptions,
  RoundedRectDrawOptions,
  StrokeDrawOptions,
  CircleDrawOptions,
  QuadraticCurveDrawOptions,
  BezierCurveDrawOptions,
  ImageDrawOptions,
  TextDrawOptions,
  ClearRectOptions,
} from './interfaces'
