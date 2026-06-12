import type {} from './types'

export type { HEX, RGB } from './common/colorPicking'
export { KEY } from './common/constants'
export { getMaxPixelRatio } from './common/helpers'
export type {
  BBox,
  BezierCurveDrawOptions,
  Bounds,
  CanvasEvents,
  CanvasOptions,
  CircleDrawOptions,
  ClearRectOptions,
  ColorPickEventDetail,
  Dimension,
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
  ResizeEvent,
  RoundedRectDrawOptions,
  StrokeDrawOptions,
  TextDrawOptions,
  TransformationMatrix,
} from './common/types'
export { default as Canvas } from './main-thread/Canvas.svelte'
export { createHitCanvas } from './main-thread/createHitCanvas'
export { default as Layer } from './main-thread/Layer.svelte'
export { LayerManager } from './main-thread/LayerManager'
export { Renderer } from './main-thread/Renderer'
export type {
  AppContext,
  CanvasContextType,
  HitCanvasRenderingContext2D,
  RegisteredLayerMetadata,
  Render,
  RenderProps,
} from './main-thread/types'
export type {
  WorkerApi,
  WorkerAppContext,
  WorkerColorPickResult,
  WorkerDrawerPayload,
  WorkerHitTestPayload,
  WorkerHitTestResult,
  WorkerInitPayload,
  WorkerRender,
  WorkerRenderProps,
  WorkerRenderRegistry,
  WorkerResizePayload,
} from './worker/types'
export { default as WorkerCanvas } from './worker/WorkerCanvas.svelte'
export { default as WorkerLayer } from './worker/WorkerLayer.svelte'
export { WorkerRenderManager } from './worker/WorkerRenderManager'
