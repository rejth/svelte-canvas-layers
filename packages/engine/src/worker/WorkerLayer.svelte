<script lang="ts">
import { createEventDispatcher, getContext, onDestroy } from 'svelte'

import { WORKER_KEY } from '../common/constants'
import type { LayerEvents } from '../common/types'

import type { WorkerAppContext, WorkerRender } from './types'

/**
 * Worker-mode layer. A renderless child of <WorkerCanvas> that registers a
 * serialized render fn (+ initial data) with the WorkerRenderManager and re-posts
 * data granularly on change.
 */

/**
 * The render function executed inside the worker on every frame.
 *
 * `render` MUST be fully self-contained:
 *   - NO captured outer variables (no closures over component state)
 *   - NO imported or module-scope helpers referenced inside the body
 *   - route ALL dynamic state through the `data` prop (structured-cloned)
 * The fn source is serialized with json-fn and reconstructed via eval in the
 * worker's global scope, where component/module bindings DO NOT EXIST. Any
 * captured reference becomes a ReferenceError or a stale snapshot in the worker.
 */
export let render: WorkerRender
export let data: unknown = undefined

const ctx = getContext<WorkerAppContext>(WORKER_KEY)
if (!ctx) throw new Error('WorkerLayer must be a child of WorkerCanvas')

const { workerManager } = ctx
const dispatcher = createEventDispatcher<LayerEvents>()

const { layerId, unregister } = workerManager.register({ render, data, dispatcher })

$: workerManager.updateData(layerId, data)

onDestroy(unregister)
</script>

<div style:display="none" data-layer-id={layerId} />
