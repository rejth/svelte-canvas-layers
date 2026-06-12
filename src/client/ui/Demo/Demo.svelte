<script lang="ts">
import When from 'client/ui/When/When.svelte'
import { Canvas } from 'core/ui'

import Blob from './Blob.svelte'
import Circle from './Circle.svelte'
import Rect from './Rect.svelte'
import { activeLayer, position } from './store'
import Text from './Text.svelte'
import Tooltip from './Tooltip.svelte'

const touch = (e: TouchEvent) => {
  e.preventDefault()
  const { left, top } = (<Element>e.target).getBoundingClientRect()
  const { clientX, clientY } = e.changedTouches[0]
  $position = { x: clientX - left, y: clientY - top }
}

export let width = 760
export let height = 560
export let className = ''
export let style = ''
</script>

<div class={className}>
  <Canvas
    useLayerEvents
    handleEventsOnLayerMove
    {width}
    {height}
    style="background-color:#f8fafc;background-image:linear-gradient(rgba(15,23,42,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,0.06) 1px,transparent 1px);background-size:32px 32px;cursor: {$activeLayer ? 'pointer' : 'default'};{style}"
    on:mousemove={(e) => ($position = { x: e.offsetX, y: e.offsetY })}
    on:touchstart={touch}
    on:touchmove={touch}
  >
    <Rect />
    <Blob />
    <Circle />
    <Text text="Whiteboard X" yOffset={-0.03} scale={0.06} />
    <When isVisible={Boolean($activeLayer?.id)}>
      <Tooltip />
    </When>
    <slot />
  </Canvas>
</div>

<style>
  div {
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>
