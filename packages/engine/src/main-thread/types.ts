import type { Bounds, LayerEventDispatcher, LayerId } from '../common/types'

import type { LayerManager } from './LayerManager'
import type { Renderer } from './Renderer'

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

export type AppContext = {
  layerManager: LayerManager
}

export type CanvasContextType = CanvasRenderingContext2D | HitCanvasRenderingContext2D

export interface HitCanvasRenderingContext2D extends Omit<CanvasRenderingContext2D, 'canvas'> {
  getLayerIdAt: (x: number, y: number) => number
  setActiveLayerId: (id: LayerId) => void
}
