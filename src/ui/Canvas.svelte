<script lang="ts">
  import { setContext, onMount, createEventDispatcher } from 'svelte';
  import {
    type HitCanvasRenderingContext2D,
    type OriginalEvent,
    type AppContext,
    RenderManager,
    KEY,
    getMaxPixelRatio,
  } from '../lib';

  /**
   * When unset, the canvas will use its clientWidth property.
   */
  export let width: number | null = null;
  /**
   * When unset, the canvas will use its clientHeight property.
   */
  export let height: number | null = null;
  /**
   * If pixelRatio is unset, the canvas uses devicePixelRatio binding to match the window’s pixel dens.
   * If pixelRatio is set to "auto", the canvas-size library is used to automatically calculate the maximum supported pixel ratio based on the browser and canvas size.
   * This can be particularly useful when rendering large canvases on iOS Safari (https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/)
   */
  export let pixelRatio: 'auto' | number | null = 'auto';
  /**
   * User settings for canvas rendering context
   */
  export let settings: CanvasRenderingContext2DSettings | undefined = undefined;
  export let className = '';
  export let style = '';

  export const getCanvasElement = (): HTMLCanvasElement => canvasRef;
  export const getCanvasContext = (): HitCanvasRenderingContext2D | null => renderManager.context;

  const renderManager = new RenderManager();
  const { geometryManager } = renderManager;

  const dispatch = createEventDispatcher();

  let canvasRef: HTMLCanvasElement;
  let backgroundCanvas: HTMLCanvasElement;
  let layerRef: HTMLDivElement;
  let canvasWidth: number;
  let canvasHeight: number;
  let maxPixelRatio: number | undefined;

  setContext<AppContext>(KEY, { renderManager });

  onMount(() => {
    renderManager.init(canvasRef, layerRef, settings);
    renderManager.drawBackgroundGrid(backgroundCanvas);
    return () => renderManager.destroy();
  });

  const resize = (node: Element) => {
    const canvasObserver = new ResizeObserver(([{ contentRect }]) => {
      canvasWidth = contentRect.width;
      canvasHeight = contentRect.height;
    });

    canvasObserver.observe(node);

    return {
      destroy: () => canvasObserver.disconnect(),
    };
  };

  const handleLayerMouseMove = (e: MouseEvent) => {
    renderManager.findActiveLayer(e);
  };

  const handleLayerTouchStart = (e: TouchEvent) => {
    renderManager.findActiveLayer(e);
    renderManager.dispatchEvent(e);
  };

  const handleEvent = (e: OriginalEvent) => {
    renderManager.dispatchEvent(e);
  };

  $: _width = width ?? canvasWidth ?? 0;
  $: _height = height ?? canvasHeight ?? 0;

  /**
   * If pixelRatio is set to "auto", we will calculate the maximum supported pixel ratio based on the browser and canvas size.
   * Calculate a new maxPixelRatio each time _width, _height or devicePixelRatio change.
   */
  $: if (window.devicePixelRatio && pixelRatio === 'auto') {
    maxPixelRatio = getMaxPixelRatio(_width, _height, window.devicePixelRatio);
  } else {
    maxPixelRatio = undefined;
  }

  /**
   * _pixelRatio parameter allows to prevent canvas items from appearing blurry on higher-resolution displays.
   * This is useful when rendering large canvases on iOS Safari (https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/)
   * To do this, we scale canvas for high resolution displays:
   * 1. Set the "actual" size of the canvas:
        canvas.width = Math.floor(_width * _pixelRatio)
        canvas.height =  Math.floor(_height * _pixelRatio)
   * 2. Set the "drawn" size of the canvas:
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
   */
  $: _pixelRatio = maxPixelRatio ?? <number>pixelRatio ?? window.devicePixelRatio ?? 2;

  /**
   * Update app state each time _width, _height or _pixelRatio values of the canvas change
   */
  $: renderManager.width = _width;
  $: renderManager.height = _height;
  $: renderManager.pixelRatio = _pixelRatio;
  $: geometryManager.pixelRatio = _pixelRatio;

  /**
   * Adjust canvas's transformation matrix to scale drawings according to the width, height values or device's pixel ratio
   */
  $: _width, _height, _pixelRatio, renderManager.redraw();

  /**
   * Dispatch "resize" event to the parent component each time _width, _height or _pixelRatio values of the canvas change
   */
  $: dispatch('resize', {
    width: _width,
    height: _height,
    pixelRatio: _pixelRatio,
  });
</script>

<div class="canvas-wrapper">
  <canvas
    class={`canvas ${className}`}
    width={Math.floor(_width)}
    height={Math.floor(_height)}
    style:width={width ? `${width}px` : '100%'}
    style:height={height ? `${height}px` : '100%'}
    {style}
    use:resize
    bind:this={canvasRef}
    bind:clientWidth={canvasWidth}
    bind:clientHeight={canvasHeight}
    on:mousemove={handleLayerMouseMove}
    on:pointermove={handleLayerMouseMove}
    on:touchstart={handleLayerTouchStart}
    on:click={handleEvent}
    on:contextmenu={handleEvent}
    on:dblclick={handleEvent}
    on:mousedown={handleEvent}
    on:mouseup={handleEvent}
    on:wheel={handleEvent}
    on:touchcancel={handleEvent}
    on:touchend={handleEvent}
    on:touchmove={handleEvent}
    on:pointerdown={handleEvent}
    on:pointerup={handleEvent}
    on:pointercancel={handleEvent}
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
  />
  <canvas
    class="background-canvas"
    width={Math.floor(_width)}
    height={Math.floor(_height)}
    style:width={width ? `${width}px` : '100%'}
    style:height={height ? `${height}px` : '100%'}
    bind:this={backgroundCanvas}
  />
  <div style:display="none" bind:this={layerRef}>
    <slot />
  </div>
</div>

<style>
  .canvas-wrapper {
    position: relative;
  }

  .canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .background-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    touch-action: none;
    user-select: none;
    cursor: none;
    z-index: -1;
  }
</style>
