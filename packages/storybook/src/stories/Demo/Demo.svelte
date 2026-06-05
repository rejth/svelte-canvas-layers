<script lang="ts">
import { Canvas } from '@canvas/engine'

import type { Mode } from '../../shared/modeArg'
import WorkerUnsupported from '../../shared/WorkerUnsupported.svelte'

import Blob from './Blob.svelte'
import Circle from './Circle.svelte'
import Rect from './Rect.svelte'
import { activeLayer, position } from './store'
import Text from './Text.svelte'
import Tooltip from './Tooltip.svelte'

export let mode: Mode = 'main'

const touch = (e: TouchEvent) => {
  e.preventDefault()
  const { left, top } = (<Element>e.target).getBoundingClientRect()
  const { clientX, clientY } = e.changedTouches[0]
  $position = { x: clientX - left, y: clientY - top }
}
</script>

<div class="story-viewport">
  {#if mode === 'worker'}
    <WorkerUnsupported feature="Demo layer events" />
  {:else}
    <Canvas
      useLayerEvents
      handleEventsOnLayerMove
      on:mousemove={(e) => ($position = { x: e.offsetX, y: e.offsetY })}
      on:touchstart={touch}
      on:touchmove={touch}
    >
      <Rect />
      <Blob />
      <Circle />
      <Text text="@canvas/engine" yOffset={-0.02} scale={0.052} />
      <Text text="Reactive canvas components" scale={0.026} yOffset={0.1} opacity={0.7} />
      {#if $activeLayer?.id}
        <Tooltip />
      {/if}
    </Canvas>
  {/if}
</div>

<style>
  .story-viewport {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    background: #fff;
  }
</style>
