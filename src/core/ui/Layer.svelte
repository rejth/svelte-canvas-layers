<script lang="ts">
  import { getContext, onDestroy, createEventDispatcher, afterUpdate } from 'svelte';

  import { KEY } from 'core/constants';
  import { type Render, type LayerEvents, type AppContext, type Bounds } from 'core/interfaces';

  /**
   * The Layer component encapsulates a piece of canvas rendering logic.
   * It is a renderless component that accepts only render function and registers a new layer on the canvas.
   */

  export let render: Render;
  export let bounds: Bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };

  const { renderManager } = getContext<AppContext>(KEY);
  const dispatcher = createEventDispatcher<LayerEvents>();

  const { layerId, unregister } = renderManager.register({ render, dispatcher, bounds });

  afterUpdate(renderManager.redraw);
  onDestroy(unregister);
</script>

<div style:display="none" data-layer-id={layerId} />
