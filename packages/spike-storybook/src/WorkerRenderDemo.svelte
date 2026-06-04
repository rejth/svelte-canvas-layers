<script lang="ts">
import { onDestroy } from 'svelte'
import type { WorkerRender } from '@canvas/engine'
import { WorkerCanvas, WorkerLayer } from '@canvas/engine'

type SquareData = { x: number; y: number; size: number; color: string }

const render: WorkerRender = ({ ctx, width, height, data }) => {
  const square = data as SquareData
  const size = Math.max(square.size, Math.min(width, height) * 0.24)
  const margin = 32
  const maxX = Math.max(margin, width - size - margin)
  const x = Math.min(square.x, maxX)
  const y = height / 2 - size / 2

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = square.color
  ctx.fillRect(x, y, size, size)
}

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
  <WorkerCanvas style="display:block;">
    <WorkerLayer {render} {data} />
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
