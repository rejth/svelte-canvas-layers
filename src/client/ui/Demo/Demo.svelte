<script lang="ts">
  import { Canvas } from 'core/ui';

  import Rect from './Rect.svelte';
  import Circle from './Circle.svelte';
  import Blob from './Blob.svelte';
  import Text from './Text.svelte';
  import Tooltip from './Tooltip.svelte';
  import { position, activeLayer } from './store';

  const touch = (e: TouchEvent) => {
    e.preventDefault();
    const { left, top } = (<Element>e.target).getBoundingClientRect();
    const { clientX, clientY } = e.changedTouches[0];
    $position = { x: clientX - left, y: clientY - top };
  };
</script>

<div>
  <Canvas
    useLayerEvents
    width={760}
    height={560}
    style="cursor: {$activeLayer ? 'pointer' : 'default'}"
    on:mousemove={(e) => ($position = { x: e.offsetX, y: e.offsetY })}
    on:touchstart={touch}
    on:touchmove={touch}
  >
    <Rect />
    <Blob />
    <Circle />
    <Text text="Canvasio" yOffset={-0.03} scale={0.06} />
    <Text text="Simple whiteboard" scale={0.0297} yOffset={0.04} opacity={0.7} />
    {#if $activeLayer?.id}
      <Tooltip />
    {/if}
  </Canvas>
</div>

<style>
  div {
    overflow: hidden;
    position: relative;
    aspect-ratio: 5/3;
  }
</style>
