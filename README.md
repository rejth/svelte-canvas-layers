# Svelte Canvas Layers

Declarative canvas rendering for Svelte 4.

Svelte Canvas Layers wraps the native HTML `<canvas>` element with a small layer-based rendering runtime. It gives Svelte apps a component model for defining canvas layers, handling pointer events, performing hit testing, and rendering either on the main thread or inside a Web Worker.

> Svelte Canvas Layers currently targets Svelte 4 only.

The repository includes a small whiteboard-style demo app built on top of the canvas layer API. It shows camera controls, editable objects, selection, arrows, and layer picking. / 
[Storybook](https://svelte-canvas-layers-storybook.vercel.app/) contains focused examples for the engine package, including main-thread rendering, worker rendering, color picking, layer events, pixel ratio handling, and resizable layers.

<img width="1720" height="927" alt="image" src="https://github.com/user-attachments/assets/e48715dd-0526-4298-ba37-444e53e10a7a" />
<img width="1719" height="927" alt="image" src="https://github.com/user-attachments/assets/23db0bb8-461a-40f7-8caa-be161b7306d0" />

## Why This Exists

It is a playground for the kind of architecture behind whiteboards, drawing tools, visual editors, diagrams, and canvas-based UI: a scene made of interactive layers, a camera that transforms user input into world coordinates, and UI workflows built on top of those primitives.

The project began as an exploration of the Canvas 2D API and Svelte. The browser canvas API is powerful, but it is imperative by default. Svelte Canvas Layers keeps the canvas itself native while giving Svelte apps a component model for organizing rendering and interaction.

## Features

- Svelte wrapper around HTML `<canvas>`
- Declarative `<Canvas>` and `<Layer>` components
- Direct Canvas 2D rendering through `CanvasRenderingContext2D`
- Layer-level pointer, click, hover, and drag-style interactions
- Color-based hit testing for interactive canvas objects
- Main-thread rendering support
- Web Worker rendering support
- Worker-owned renderer registry
- Built for Svelte 4

## Main Thread Example

```svelte
<script lang="ts">
  import { Canvas, Layer } from '@canvas/engine'

  const box = { x: 40, y: 40, width: 120, height: 80, color: 'tomato' }
</script>

<Canvas width={800} height={600} useLayerEvents>
  <Layer
    bounds={{
      x0: box.x,
      y0: box.y,
      x1: box.x + box.width,
      y1: box.y + box.height,
    }}
    render={({ ctx }) => {
      ctx.fillStyle = box.color
      ctx.fillRect(box.x, box.y, box.width, box.height)
    }}
    on:click={() => console.log('box clicked')}
  />
</Canvas>
```

## Worker Example

```svelte
<script lang="ts">
  import { WorkerCanvas, WorkerLayer } from '@canvas/engine'

  const box = { x: 40, y: 40, width: 120, height: 80, color: 'tomato' }
</script>

<WorkerCanvas
  createWorker={() =>
    new Worker(new URL('./canvas.worker.ts', import.meta.url), { type: 'module' })
  }
>
  <WorkerLayer renderer="box" data={box} />
</WorkerCanvas>
```

```ts
// canvas.worker.ts
import {
  exposeCanvasWorker,
  type WorkerRenderRegistry,
} from '@canvas/engine/worker-runtime'

const renderers = {
  box({ ctx, data }) {
    ctx.fillStyle = data.color
    ctx.fillRect(data.x, data.y, data.width, data.height)
  },
} satisfies WorkerRenderRegistry

exposeCanvasWorker(renderers)
```

## Storybook

[Storybook](https://svelte-canvas-layers-storybook.vercel.app/) contains focused examples for the engine package, including main-thread rendering, worker rendering, color picking, layer events, pixel ratio handling, and resizable layers.

```bash
pnpm dev:storybook
```

## Development

```bash
pnpm install
pnpm dev
pnpm check
```

Useful package checks:

```bash
pnpm --filter @canvas/engine check
pnpm --filter @canvas/engine build
pnpm --filter @canvas/storybook build
```

## Deploy Builds

The app and Storybook build as separate static targets:

```bash
pnpm build:app
pnpm build:storybook
pnpm build:deploy
```

Outputs:

- App: `dist/app`
- Storybook: `packages/storybook/dist`

Preview locally:

```bash
pnpm preview:app        # app on http://localhost:4173
pnpm preview:storybook  # storybook on http://localhost:6007
```
