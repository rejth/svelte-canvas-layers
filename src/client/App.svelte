<script lang="ts">
import { type ComponentType, onMount } from 'svelte'
import { cubicOut, quintOut } from 'svelte/easing'
import { fade, scale } from 'svelte/transition'
import { CURSORS } from 'client/shared/constants'
import { Tools } from 'client/shared/interfaces'
import Background from 'client/ui/Background/Background.svelte'
import { canvasStore } from 'client/ui/Canvas/store'
import Connection from 'client/ui/Connection/Connection.svelte'
import { connectionStore } from 'client/ui/Connection/store'
import Demo from 'client/ui/Demo/Demo.svelte'
import Keyboard from 'client/ui/Keyboard/Keyboard.svelte'
import type { ResizableLayerEventDetails } from 'client/ui/ResizableLayer/interfaces'
import ResizableLayer from 'client/ui/ResizableLayer/ResizableLayer.svelte'
import Selection from 'client/ui/Selection/Selection.svelte'
import TextEditor from 'client/ui/TextEditor/TextEditor.svelte'
import { toolbarStore } from 'client/ui/Toolbar/store'
import Toolbar from 'client/ui/Toolbar/Toolbar.svelte'
import When from 'client/ui/When/When.svelte'
import Zoom from 'client/ui/Zoom/Zoom.svelte'
import type { Bounds, Point, RenderProps } from 'core/interfaces'
import { type Camera } from 'core/services'
import { Canvas, Layer } from 'core/ui'
import { dndWatcher } from 'yieldkit'

import 'client/shared/styles/_global.css'

let canvas: Canvas
let camera: Camera
let selection: Point[] = []
let isLayerEntered = false
let isHomeVisible = true
let homeCtaActive = false
let viewportWidth = 1280
let viewportHeight = 720

const { tool } = toolbarStore
const { shapes, selectionPath, textEditor, clickOutsideExcludedIds, isSelected } = canvasStore
const { currentConnection, connections } = connectionStore

$: connection = $tool === Tools.CONNECT
$: panning = $tool === Tools.PAN
$: cursorStyle = panning ? `cursor: ${CURSORS.HAND}` : ``
$: selection = $selectionPath.length > 0 ? $selectionPath : selection

onMount(async () => {
  camera = canvas.getCamera()

  const ref = canvas.getCanvasElement()
  const rect = ref.getBoundingClientRect()
  const selectionWatcher = dndWatcher(ref)

  for await (const e of selectionWatcher) {
    const transformedPoint = camera.handleCanvasClick(<MouseEvent>e)
    canvasStore.dragSelection(<MouseEvent>e, rect, transformedPoint)
  }
})

const handleCanvasClick = (e: MouseEvent) => {
  if ($isSelected) return
  const transformedPoint = camera.handleCanvasClick(e)

  canvasStore.addShape(e, transformedPoint)
  selection = $selectionPath
  canvasStore.resetSelection()
}

const handleCanvasMouseDown = (e: MouseEvent) => {
  if (!panning) return
  camera.handleMouseDown(e)
}

const handleCanvasMouseUp = (e: MouseEvent) => {
  if (!panning) return
  camera.handleMouseUp(e)
}

const handleCanvasMouseMove = (e: MouseEvent) => {
  if ($textEditor) return
  camera.handleMouseMove(e)
  if (isLayerEntered) return
  const transformedPoint = camera.handleCanvasClick(e)
  connectionStore.handleCanvasMouseMove(transformedPoint)
}

const handleCanvasWheel = (e: WheelEvent) => {
  if ($textEditor) return
  camera.handleWheelChange(e)
}

const handleLayerMouseDown = () => {
  canvasStore.setIsSelected(true)
}

const handleLayerActive = (e: CustomEvent<ResizableLayerEventDetails>) => {
  if (!e.detail) return
  canvasStore.selectShape(e.detail.entityId)
}

const handleLayerLeave = (e: CustomEvent<ResizableLayerEventDetails>) => {
  if (!e.detail) return
  canvasStore.deselectShape(e.detail.entityId)
  canvasStore.setIsSelected(false)
  canvasStore.saveText()
  isLayerEntered = false
}

const handleLayerTouch = (e: CustomEvent<ResizableLayerEventDetails>) => {
  if (!e.detail) return
  connectionStore.handleBoxSelect(e, e.detail.entityId)
}

const handleLayerMove = (e: CustomEvent<ResizableLayerEventDetails>) => {
  if (!e.detail) return
  connectionStore.handleBoxMove(e, e.detail.entityId)
}

const handleLayerEnter = (e: CustomEvent<ResizableLayerEventDetails>) => {
  if (!e.detail) return
  isLayerEntered = true
  connectionStore.handleBoxEnter(e, e.detail.entityId)
}

const handleLayerDoubleClick = (e: CustomEvent<ResizableLayerEventDetails>) => {
  if (connection || !e.detail?.data) return
  const { entityId, data, bounds } = e.detail
  const transformedPoint = camera.handleLayerDoubleClick(data, bounds)
  canvasStore.initTextEditor(entityId, transformedPoint)
}

const openCanvas = () => {
  isHomeVisible = false
}

$: homeWidth = viewportWidth || 1280
$: homeHeight = viewportHeight || 720
$: ctaWidth = Math.min(230, Math.max(170, homeWidth * 0.22))
$: ctaHeight = 58
$: ctaBounds = {
  x0: homeWidth / 2 - ctaWidth / 2,
  y0: Math.min(homeHeight - 112, homeHeight * 0.74),
  x1: homeWidth / 2 + ctaWidth / 2,
  y1: Math.min(homeHeight - 112, homeHeight * 0.74) + ctaHeight,
} satisfies Bounds

const isPointInsideHomeCta = ({ x, y }: Point) =>
  x >= ctaBounds.x0 && x <= ctaBounds.x1 && y >= ctaBounds.y0 && y <= ctaBounds.y1

const getHomeCanvasPoint = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

const handleHomePointerMove = (e: MouseEvent) => {
  homeCtaActive = isPointInsideHomeCta(getHomeCanvasPoint(e))
}

const handleHomeClick = (e: MouseEvent) => {
  if (!isPointInsideHomeCta(getHomeCanvasPoint(e))) return
  openCanvas()
}

const handleHomeKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  openCanvas()
}

const renderHomeCta = ({ ctx }: RenderProps) => {
  const { x0, y0, x1, y1 } = ctaBounds
  const width = x1 - x0
  const height = y1 - y0
  const radius = 8
  const lift = homeCtaActive ? -2 : 0
  const arrowX = x1 - 34
  const centerY = y0 + height / 2 + lift

  ctx.save()
  ctx.globalAlpha = 0
  ctx.fillRect(x0, y0, width, height)
  ctx.globalAlpha = 1

  ctx.translate(0, lift)
  ctx.shadowColor = 'rgba(17, 24, 39, 0.24)'
  ctx.shadowBlur = homeCtaActive ? 26 : 18
  ctx.shadowOffsetY = homeCtaActive ? 14 : 10
  ctx.fillStyle = homeCtaActive ? '#0f172a' : '#111827'
  ctx.beginPath()
  ctx.roundRect(x0, y0, width, height, radius)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = '#fff'
  ctx.font = '700 16px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Open canvas', x0 + 24, centerY)

  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(arrowX - 8, centerY)
  ctx.lineTo(arrowX + 8, centerY)
  ctx.moveTo(arrowX + 2, centerY - 6)
  ctx.lineTo(arrowX + 8, centerY)
  ctx.lineTo(arrowX + 2, centerY + 6)
  ctx.stroke()
  ctx.restore()
}
</script>

<svelte:window bind:innerWidth={viewportWidth} bind:innerHeight={viewportHeight} />

<main class:workspace-ready={!isHomeVisible}>
  <Toolbar />
  <Zoom />
  <Keyboard />
  <When isVisible={Boolean($textEditor?.isEditable)}>
    <TextEditor
      anchorId={$textEditor?.anchorId}
      position={$textEditor?.position}
      transform={camera?.renderer?.getTransform()}
    />
  </When>
  <Canvas
    useLayerEvents={!panning}
    handleEventsOnLayerMove={connection}
    {clickOutsideExcludedIds}
    width={viewportWidth}
    height={viewportHeight}
    style={cursorStyle}
    bind:this={canvas}
    on:outclick={() => (selection = [])}
    on:click={handleCanvasClick}
    on:mousedown={handleCanvasMouseDown}
    on:mousemove={handleCanvasMouseMove}
    on:mouseup={handleCanvasMouseUp}
    on:wheel={handleCanvasWheel}
  >
    <Background />
    <When isVisible={$tool === Tools.SELECT}>
      <Selection path={$selectionPath} />
    </When>
    <When isVisible={connection && Boolean($currentConnection)}>
      <Connection source={$currentConnection?.source} target={$currentConnection?.target} />
    </When>
    {#each $connections.entries() as [connectionId, { source, target }] (connectionId)}
      <Connection {connectionId} {source} {target} selectOnMakingConnection={connection} />
    {/each}
    {#each $shapes.values() as shape (shape.id)}
      <ResizableLayer
        entityId={shape.id}
        initialBounds={shape.getBounds()}
        isSelected={shape.isSelected}
        selectionPath={selection}
        selectOnMakingConnection={connection}
        isMovingBlocked={connection}
        on:mousedown={handleLayerMouseDown}
        on:layer.enter={handleLayerEnter}
        on:layer.touch={handleLayerTouch}
        on:layer.dblclick={handleLayerDoubleClick}
        on:layer.active={handleLayerActive}
        on:layer.leave={handleLayerLeave}
        on:layer.move={handleLayerMove}
      />
    {/each}
  </Canvas>
</main>

{#if isHomeVisible}
  <section
    class="home-screen"
    transition:fade={{ duration: 420, easing: cubicOut }}
    aria-label="Whiteboard X home"
  >
    <div
      class="home-canvas"
      class:home-cta-active={homeCtaActive}
      in:scale={{ duration: 620, start: 1.03, opacity: 0, easing: quintOut }}
      on:mousemove={handleHomePointerMove}
      on:mouseleave={() => (homeCtaActive = false)}
      on:click={handleHomeClick}
      on:keydown={handleHomeKeyDown}
      role="button"
      tabindex="0"
      aria-label="Open blank canvas"
    >
      <Demo
        width={homeWidth}
        height={homeHeight}
        style="display:block;cursor:{homeCtaActive ? 'pointer' : 'default'};"
      >
        <Layer render={renderHomeCta} bounds={ctaBounds} />
      </Demo>
    </div>
  </section>
{/if}

<style>
  main {
    height: 100%;
    opacity: 0.35;
    filter: saturate(0.8) blur(8px);
    transform: scale(0.985);
    transition:
      opacity 520ms cubic-bezier(0.22, 1, 0.36, 1),
      filter 520ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  main.workspace-ready {
    opacity: 1;
    filter: none;
    transform: scale(1);
  }

  .home-screen {
    position: fixed;
    inset: 0;
    z-index: 30;
    overflow: hidden;
    background: #fff;
  }

  .home-canvas {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .home-canvas.home-cta-active {
    cursor: pointer;
  }

  .home-canvas :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
