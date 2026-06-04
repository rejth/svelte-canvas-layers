import type { Bounds, CanvasContextType, LayerEventDispatcher } from './layerTypes'
import type { Renderer } from './services/Renderer'

export type RenderProps = {
  ctx: CanvasContextType
  renderer: Renderer
}

export interface Render {
  (data: RenderProps): void
}

export interface RegisteredLayerMetadata {
  render: Render
  dispatcher?: LayerEventDispatcher
  bounds?: Bounds
}
