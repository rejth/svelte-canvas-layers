<script lang="ts">
import { onMount } from 'svelte'
import { Canvas } from '@canvas/engine'
import type { CanvasContextType } from 'core/interfaces'
import { Camera } from 'core/services'

/**
 * When unset, the canvas will use its clientWidth property.
 */
export let width: number | null = null
/**
 * When unset, the canvas will use its clientHeight property.
 */
export let height: number | null = null
/**
 * If pixelRatio is unset, the canvas uses devicePixelRatio binding to match the window’s pixel dens.
 * If pixelRatio is set to "auto", the canvas-size library is used to automatically calculate the maximum supported pixel ratio based on the browser and canvas size.
 */
export let pixelRatio: 'auto' | null = 'auto'
/**
 * User settings for canvas rendering context
 */
export let settings: CanvasRenderingContext2DSettings | undefined = undefined
/**
 * When useLayerEvents is true, we proxy CanvasRenderingContext2D methods to a second, offscreen canvas (in the main thread) for layer event management.
 */
export let useLayerEvents = false
export let handleEventsOnLayerMove = false
export let clickOutsideExcludedIds: string[] = []
export let className = ''
export let style = ''

let engineCanvas: Canvas
let camera: Camera

export const getCamera = () => camera
export const getCanvasElement = (): HTMLCanvasElement => engineCanvas.getCanvasElement()
export const getCanvasContext = (): CanvasContextType | null => engineCanvas.getCanvasContext()

onMount(() => {
  const layerManager = engineCanvas.getLayerManager()
  camera = new Camera(layerManager)
  camera.init(engineCanvas.getCanvasContext())
})
</script>

<Canvas
  bind:this={engineCanvas}
  {width}
  {height}
  {pixelRatio}
  {settings}
  {useLayerEvents}
  {handleEventsOnLayerMove}
  {clickOutsideExcludedIds}
  {className}
  {style}
  on:resize
  on:focus
  on:blur
  on:fullscreenchange
  on:fullscreenerror
  on:scroll
  on:cut
  on:copy
  on:paste
  on:keydown
  on:keypress
  on:keyup
  on:auxclick
  on:click
  on:contextmenu
  on:dblclick
  on:mousedown
  on:mouseenter
  on:mouseleave
  on:mousemove
  on:mouseover
  on:mouseout
  on:mouseup
  on:select
  on:wheel
  on:drag
  on:dragend
  on:dragenter
  on:dragstart
  on:dragleave
  on:dragover
  on:drop
  on:touchcancel
  on:touchend
  on:touchmove
  on:touchstart
  on:pointerover
  on:pointerenter
  on:pointerdown
  on:pointermove
  on:pointerup
  on:pointercancel
  on:pointerout
  on:pointerleave
  on:gotpointercapture
  on:lostpointercapture
  on:outclick
>
  <slot />
</Canvas>
