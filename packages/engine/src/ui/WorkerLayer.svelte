<script lang="ts">
import { getContext, onDestroy } from 'svelte'

import { WORKER_KEY } from '../constants'
import type { WorkerAppContext, WorkerRender } from '../interfaces'

/**
 * Worker-mode layer. A renderless child of <WorkerCanvas> that registers a
 * serialized render fn (+ initial data) with the WorkerRenderManager and re-posts
 * data granularly on change (D-05). It is the worker analog of <Layer>; the
 * main-thread <Layer> surface is unchanged (MODE-03).
 */

/**
 * The render function executed inside the worker on every frame.
 *
 * !!! CLOSURE CONTRACT (D-06) — READ BEFORE WRITING A render FN !!!
 * `render` MUST be fully self-contained:
 *   - NO captured outer variables (no closures over component state)
 *   - NO imported or module-scope helpers referenced inside the body
 *   - route ALL dynamic state through the `data` prop (structured-cloned)
 * The fn source is serialized with json-fn and reconstructed via eval in the
 * worker's global scope, where component/module bindings DO NOT EXIST. Any
 * captured reference becomes a ReferenceError or a stale snapshot in the worker.
 *
 * SECURITY: because the source is reconstructed via eval, NEVER pass untrusted or
 * remote function source as `render` (T-04-01). It must be your own author-time fn.
 */
export let render: WorkerRender
export let data: unknown = undefined

// D-03 pairing guard: a WorkerLayer must live under a WorkerCanvas, which sets
// the worker context under WORKER_KEY. A WorkerLayer under a main-thread <Canvas>
// (which sets KEY, not WORKER_KEY) finds nothing here and fails loudly.
const ctx = getContext<WorkerAppContext>(WORKER_KEY)
if (!ctx) throw new Error('WorkerLayer must be a child of WorkerCanvas')

const { workerManager } = ctx

const { layerId, unregister } = workerManager.register({ render, data })

// D-05: re-post ONLY this layer's data on change (replaces Layer.svelte's
// afterUpdate full redraw). The worker mutates the target layer's data in place.
$: workerManager.updateData(layerId, data)

onDestroy(unregister)
</script>

<div style:display="none" data-layer-id={layerId} />
