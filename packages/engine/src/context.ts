import type { LayerManager } from './services/LayerManager'
import type { WorkerRenderManager } from './services/WorkerRenderManager'

export type AppContext = {
  layerManager: LayerManager
}

/**
 * Worker app-context (D-05), provided under WORKER_KEY (distinct from KEY so a
 * WorkerLayer under a main-thread <Canvas> finds no worker context).
 */
export type WorkerAppContext = {
  workerManager: WorkerRenderManager
}
