<script lang="ts">
import { createEventDispatcher, getContext, onDestroy } from 'svelte'

import { WORKER_KEY } from '../common/constants'
import type { LayerEvents } from '../common/types'

import type { WorkerAppContext } from './types'

/**
 * Worker-mode layer. A renderless child of <WorkerCanvas> that registers a
 * worker-resident renderer id (+ initial data) with the WorkerRenderManager and
 * re-posts data granularly on change.
 */

/**
 * The key of a renderer registered in the WorkerCanvas worker entrypoint.
 */
export let renderer: string
export let data: unknown = undefined

const ctx = getContext<WorkerAppContext>(WORKER_KEY)
if (!ctx) throw new Error('WorkerLayer must be a child of WorkerCanvas')

const { workerManager } = ctx
const dispatcher = createEventDispatcher<LayerEvents>()

const { layerId, unregister } = workerManager.register({ renderer, data, dispatcher })

$: workerManager.updateData(layerId, data)

onDestroy(unregister)
</script>

<div style:display="none" data-layer-id={layerId} />
