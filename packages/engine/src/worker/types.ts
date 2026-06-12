import type { HEX } from '../common/colorPicking'
import type { LayerId } from '../common/types'

import type { WorkerRenderManager } from './WorkerRenderManager'

export type WorkerAppContext = {
  workerManager: WorkerRenderManager
}

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

export type WorkerRenderRegistry = Record<string, WorkerRender>

export type WorkerInitPayload = {
  canvas: OffscreenCanvas
  width: number
  height: number
  pixelRatio: number
  useLayerEvents: boolean
}

export type WorkerResizePayload = {
  width?: number
  height?: number
  pixelRatio?: number
  useLayerEvents?: boolean
}

export type WorkerDrawerPayload = {
  layerId: LayerId
  renderer: string
  data: unknown
}

export type WorkerLayerSequencePayload = {
  layerSequence: LayerId[]
}

export type WorkerDataPayload = {
  layerId: LayerId
  data: unknown
}

export type WorkerColorPickResult = {
  hex: HEX
  x: number
  y: number
} | null

export type WorkerHitTestPayload = {
  requestId: number
  x: number
  y: number
}

export type WorkerHitTestResult = {
  requestId: number
  layerId: LayerId
}

export interface WorkerApi {
  init(payload: WorkerInitPayload): void
  resize(payload: WorkerResizePayload): void
  addDrawer(payload: WorkerDrawerPayload): void
  removeDrawer(layerId: LayerId): void
  setLayerSequence(payload: WorkerLayerSequencePayload): void
  updateData(payload: WorkerDataPayload): void
  pickColor(x: number, y: number): WorkerColorPickResult
  hitTest(payload: WorkerHitTestPayload): WorkerHitTestResult
}
