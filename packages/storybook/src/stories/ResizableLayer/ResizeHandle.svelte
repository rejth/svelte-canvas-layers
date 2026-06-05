<script lang="ts">
import type { Render } from '@canvas/engine'
import { Layer } from '@canvas/engine'

export let x: number
export let y: number
export let active = false

const SIZE = 12

const render: Render = ({ ctx }) => {
  ctx.fillStyle = active ? '#f8fafc' : '#6b7280'
  ctx.strokeStyle = '#111827'
  ctx.lineWidth = 1
  ctx.fillRect(x - SIZE / 2, y - SIZE / 2, SIZE, SIZE)
  ctx.strokeRect(x - SIZE / 2, y - SIZE / 2, SIZE, SIZE)
}
</script>

<Layer
  {render}
  on:mouseenter
  on:mouseleave
  on:mousedown
  on:touchstart
/>
