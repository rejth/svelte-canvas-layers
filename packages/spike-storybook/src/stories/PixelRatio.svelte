<script lang="ts">
import type { WorkerRender } from '@canvas/engine'

import ModeCanvas from '../shared/ModeCanvas.svelte'
import type { Mode } from '../shared/modeArg'

export let mode: Mode = 'main'

type HeightSetting = { value: number; label: string }
type PixelRatioSetting = { value: number | 'auto' | null; label: string }

const heights: HeightSetting[] = [
  { value: 1000, label: '1000' },
  { value: 10000, label: '10000' },
  { value: 100000, label: '100000' },
]

const pixelRatios: PixelRatioSetting[] = [
  { value: null, label: 'unset' },
  { value: 3, label: '3' },
  { value: 0.5, label: '0.5' },
  { value: 'auto', label: "'auto'" },
]

let heightSetting = heights[0]
let pixelRatioSetting = pixelRatios[0]

const render: WorkerRender = ({ ctx, width, height, pixelRatio }) => {
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'tomato'
  ctx.font = `${Math.floor(width / 14)}px 'Fira Mono', monospace`
  ctx.fillText(`pixelRatio: ${pixelRatio.toFixed(2)}`, width / 2, width / 4)

  ctx.fillStyle = '#475569'
  ctx.font = `${Math.floor(width / 30)}px 'Fira Mono', monospace`
  ctx.fillText(
    `${width}x${height} css → ${Math.round(width * pixelRatio)}x${Math.round(height * pixelRatio)} device px`,
    width / 2,
    width / 4 + width / 16,
  )
}
</script>

<div class="pixel-ratio-story">
  <div class="controls">
    <div>
      canvas height:
      {#each heights as option}
        <button
          type="button"
          on:click={() => (heightSetting = option)}
          disabled={option.label === heightSetting.label}
        >
          {option.label}
        </button>
      {/each}
    </div>

    <div>
      pixel ratio:
      {#each pixelRatios as option}
        <button
          type="button"
          on:click={() => (pixelRatioSetting = option)}
          disabled={option.label === pixelRatioSetting.label}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <ModeCanvas
    {mode}
    {render}
    height={heightSetting.value}
    pixelRatio={pixelRatioSetting.value}
  />
</div>

<style>
  .pixel-ratio-story {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    overflow: hidden;
    background: #fff;
  }

  .controls {
    position: absolute;
    z-index: 1;
    top: 8px;
    left: 8px;
    right: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
    align-items: center;
    color: #111827;
    font-family: ui-sans-serif, system-ui;
    font-size: 20px;
    font-weight: 600;
  }

  button {
    margin-left: 4px;
    padding: 2px 8px;
    border: 1px solid #94a3b8;
    border-radius: 2px;
    color: #111827;
    font: inherit;
    font-size: 18px;
  }

  button:disabled {
    background: #e2e8f0;
    color: #111827;
    opacity: 1;
  }
</style>
