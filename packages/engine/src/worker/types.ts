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

export enum WorkerActionEnum {
  INIT = 'init',
  RESIZE = 'resize',
  ADD_DRAWER = 'addDrawer',
  REMOVE_DRAWER = 'removeDrawer',
  UPDATE_DATA = 'updateData',
  SET_LAYER_SEQUENCE = 'setLayerSequence',
  PICK_COLOR = 'pickColor',
  HIT_TEST = 'hitTest',
  HIT_TEST_RESULT = 'hitTestResult',
}

export type WorkerEvent = {
  action: WorkerActionEnum
  canvas?: OffscreenCanvas
  drawers?: string
  render?: string
  data?: unknown
  layerId?: LayerId
  layerSequence?: LayerId[]
  width?: number
  height?: number
  pixelRatio?: number
  x?: number
  y?: number
  hex?: HEX
  requestId?: number
  useLayerEvents?: boolean
}
