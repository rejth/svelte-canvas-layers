<script lang="ts">
import { Canvas } from '@canvas/engine'

import type { Mode } from '../../shared/modeArg'
import WorkerUnsupported from '../../shared/WorkerUnsupported.svelte'

import Ball from './Ball.svelte'

export let mode: Mode = 'main'

type BallData = { color: string; x: number; y: number }

let balls: BallData[] = [
  { color: 'tomato', x: 0.5, y: 0.333 },
  { color: '#ffd670', x: 0.333, y: 0.625 },
  { color: 'mediumturquoise', x: 0.667, y: 0.625 },
]

const reorder = (color: string) => {
  balls = balls
    .filter((ball) => ball.color !== color)
    .concat(balls.filter((ball) => ball.color === color))
}
</script>

<div class="story-viewport">
  {#if mode === 'worker'}
    <WorkerUnsupported feature="Layer events" />
  {:else}
    <Canvas
      useLayerEvents
      handleEventsOnLayerMove
    >
      {#each balls as ball (ball.color)}
        <Ball {...ball} on:activate={() => reorder(ball.color)} />
      {/each}
    </Canvas>
  {/if}
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
