<script lang="ts">
  import { getContext, onDestroy } from 'svelte';

  import { KEY } from 'core/constants';
  import { type Render, type AppContext } from 'core/interfaces';

  /**
   * The Background Layer component encapsulates a piece of canvas background rendering logic.
   * It is a renderless component that accepts only render function and registers a new layer on the canvas.
   */

  export let render: Render;

  const { renderManager } = getContext<AppContext>(KEY);
  const { layerId, unregister } = renderManager.register({ render });

  onDestroy(unregister);
</script>

<div style:display="none" data-layer-id={layerId} />
