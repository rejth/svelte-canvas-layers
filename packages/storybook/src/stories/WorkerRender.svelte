<script lang="ts">
import { onDestroy } from 'svelte'
import { WorkerCanvas, WorkerLayer } from '@canvas/engine'

import { createStoryWorker } from '../shared/createStoryWorker'

type SquareData = { x: number; y: number; size: number; color: string }

let data: SquareData = { x: 32, y: 0, size: 240, color: '#4cc2ff' }
let direction = 1

const interval = setInterval(() => {
  let nextX = data.x + direction * 6
  if (nextX > window.innerWidth - data.size - 32 || nextX < 32) {
    direction *= -1
    nextX = data.x + direction * 4
  }
  data = { ...data, x: nextX }
}, 16)

onDestroy(() => clearInterval(interval))
</script>

<div class="story-viewport">
  <WorkerCanvas createWorker={createStoryWorker} style="display:block;">
    <WorkerLayer renderer="movingSquare" {data} />
  </WorkerCanvas>
</div>

<style>
  .story-viewport {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #fff;
  }
</style>
