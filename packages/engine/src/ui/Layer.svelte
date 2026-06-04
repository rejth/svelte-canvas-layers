<script lang="ts">
import { afterUpdate, createEventDispatcher, getContext, onDestroy } from 'svelte'

import { KEY } from '../constants'
import type { AppContext, Bounds, LayerEvents, Render } from '../interfaces'

/**
 * The Layer component encapsulates a piece of canvas rendering logic.
 * It is a renderless component that accepts only render function and registers a new layer on the canvas.
 */

export let render: Render
export let bounds: Bounds = { x0: 0, y0: 0, x1: 0, y1: 0 }

const { layerManager } = getContext<AppContext>(KEY)
const dispatcher = createEventDispatcher<LayerEvents>()

const { layerId, unregister } = layerManager.register({ render, dispatcher, bounds })

afterUpdate(() => layerManager.update(layerId, { render, bounds }))
onDestroy(unregister)
</script>

<div style:display="none" data-layer-id={layerId} />
