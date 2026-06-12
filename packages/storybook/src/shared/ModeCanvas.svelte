<script lang="ts">
import type { PixelRatio, Render, WorkerRender } from '@canvas/engine'
import { Canvas, Layer, WorkerCanvas, WorkerLayer } from '@canvas/engine'

import type { Mode } from './modeArg'

export let mode: Mode = 'main'
export let width: number | null = null
export let height: number | null = null
export let pixelRatio: PixelRatio | 'auto' | null = 'auto'
export let enablePicking = false
export let render: WorkerRender
export let renderer: string
export let createWorker: () => Worker
export let data: unknown = undefined

let canvas: { getLayerManager?: () => { redraw: () => void } } | undefined

const mainRender: Render = ({ ctx, renderer }) => {
  ;(
    render as unknown as (p: {
      ctx: unknown
      width: number
      height: number
      pixelRatio: number
      data: unknown
    }) => void
  )({
    ctx,
    width: renderer.width,
    height: renderer.height,
    pixelRatio: renderer.pixelRatio as number,
    data,
  })
}

$: if (mode === 'main' && canvas?.getLayerManager) {
  void data
  void pixelRatio
  canvas.getLayerManager().redraw()
}

const canvasStyle = 'display:block;background:#fff;'
</script>

<div class="story-viewport">
  {#if mode === 'worker'}
    <WorkerCanvas {createWorker} {width} {height} {pixelRatio} {enablePicking} style={canvasStyle}>
      <WorkerLayer {renderer} {data} />
    </WorkerCanvas>
  {:else}
    <Canvas
      bind:this={canvas}
      {width}
      {height}
      {pixelRatio}
      {enablePicking}
      style={canvasStyle}
    >
      <Layer render={mainRender} />
    </Canvas>
  {/if}
</div>

<style>
  .story-viewport {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #fff;
  }
</style>
