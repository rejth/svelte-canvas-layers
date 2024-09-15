<script lang="ts">
  import { getContext, onDestroy, createEventDispatcher, afterUpdate } from 'svelte';
  import { type Render, type LayerEvents, type AppContext, KEY } from '../lib';

  export let render: Render;

  const { renderManager } = getContext<AppContext>(KEY);
  const dispatcher = createEventDispatcher<LayerEvents>();

  const { layerId, unregister } = renderManager.register({ render, dispatcher });

  afterUpdate(renderManager.redraw);
  onDestroy(unregister);
</script>

<div style:display="none" data-layer-id={layerId} />
