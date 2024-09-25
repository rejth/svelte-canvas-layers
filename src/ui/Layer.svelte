<script lang="ts">
  import { getContext, onDestroy, createEventDispatcher, afterUpdate } from 'svelte';
  import { type Render, type LayerEvents, type AppContext } from 'lib/types';
  import { KEY } from 'lib/constants';

  /**
   * The Layer component encapsulates a piece of canvas rendering logic.
   * It is a renderless component that accepts only render function and registers a new layer on the canvas.
   */

  export let render: Render;

  const { renderManager } = getContext<AppContext>(KEY);
  const dispatcher = createEventDispatcher<LayerEvents>();

  const { layerId, unregister } = renderManager.register({ render, dispatcher });

  afterUpdate(renderManager.redraw);
  onDestroy(unregister);
</script>

<div style:display="none" data-layer-id={layerId} />
