<script lang="ts">
  import { setContext, onMount, createEventDispatcher } from 'svelte';

  import { KEY } from 'core/constants';
  import { clickOutside } from 'core/lib';
  import type {
    OriginalEvent,
    AppContext,
    CanvasContextType,
    ResizeEvent,
    PixelRatio,
  } from 'core/interfaces';
  import {
    Viewport,
    Renderer,
    LayerManager,
    createHitCanvas,
    getMaxPixelRatio,
  } from 'core/services';

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
  export let pixelRatio: 'auto' | null = 'auto';
  /**
   * User settings for canvas rendering context
   * For example, consider using "willReadFrequently: true" property if you are going to use frequent read-back operations via getImageData().
   */
  export let settings: CanvasRenderingContext2DSettings | undefined = undefined;
  /**
   * When useLayerEvents is true, we will proxy all CanvasRenderingContext2D methods to a second, offscreen canvas (in the main thread).
   * The proxy offscreen canvas is used for event management.
   * Specifically for identifying a layer using a unique fill and stroke color and then re-dispatching an event to the Layer component.
   * This has a performance cost (rendering twice in the main thread), so it’s disabled by default.
   *
   * When useLayerEvents is false, all operations will be performed on the main canvas in the main thread.
   */
  export let useLayerEvents = false;
  export let handleEventsOnLayerMove = false;
  export let clickOutsideExcludedIds: string[] = [];
  export let className = '';
  export let style = '';

  export const getRenderManager = () => layerManager;
  export const getViewport = () => viewport;
  export const getCanvasElement = (): HTMLCanvasElement => canvas;
  export const getCanvasContext = (): CanvasContextType | null => renderer.ctx;

  let canvas: HTMLCanvasElement;
  let layerContainer: HTMLDivElement;
  let canvasWidth: number;
  let canvasHeight: number;
  let maxPixelRatio: number | undefined;
  let devicePixelRatio: number | undefined;

  const renderer = new Renderer();
  const layerManager = new LayerManager(renderer);
  const viewport = new Viewport(layerManager);
  const dispatch = createEventDispatcher<ResizeEvent>();

  setContext<AppContext>(KEY, { layerManager });

  onMount(() => {
    const context = createHitCanvas(canvas, settings);
    let initialScale: PixelRatio;

    if (devicePixelRatio && pixelRatio === 'auto') {
      initialScale = getMaxPixelRatio(_width, _height, devicePixelRatio);
    } else {
      initialScale = devicePixelRatio ?? 2;
    }

    canvas.width = Math.floor(_width * initialScale);
    canvas.height = Math.floor(_height * initialScale);

    viewport.init(context);
    renderer.init(context, initialScale);
    context.scale(initialScale, initialScale);

    layerManager.onLayerChange(context.setActiveLayerId);
    layerManager.run(layerContainer);
    return () => layerManager.destroy();
  });

  const resize = (node: HTMLElement) => {
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
    if (handleEventsOnLayerMove) {
      layerManager.findActiveLayer(e);
    }
  };

  const handleLayerTouchStart = (e: TouchEvent) => {
    layerManager.findActiveLayer(e);
    layerManager.dispatchEvent(e);
  };

  const handleEvent = (e: OriginalEvent) => {
    if (!handleEventsOnLayerMove) {
      layerManager.findActiveLayer(e);
    }
    layerManager.dispatchEvent(e);
  };

  const handleClickOutside = (e: CustomEvent) => {
    layerManager.leaveActiveLayer(e);
  };

  $: _width = width ?? canvasWidth ?? 0;
  $: _height = height ?? canvasHeight ?? 0;

  /**
   * If pixelRatio is set to "auto", we will calculate the maximum supported pixel ratio based on the browser and canvas size.
   * Calculate a new maxPixelRatio each time _width, _height or devicePixelRatio change.
   */
  $: if (devicePixelRatio && pixelRatio === 'auto') {
    maxPixelRatio = getMaxPixelRatio(_width, _height, devicePixelRatio);
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
  $: _pixelRatio = maxPixelRatio ?? devicePixelRatio ?? 2;

  /**
   * Update app state each time _width, _height or _pixelRatio values of the canvas change
   */
  $: renderer.width = _width;
  $: renderer.height = _height;
  $: renderer.pixelRatio = _pixelRatio;

  /**
   * Adjust canvas's transformation matrix to scale drawings according to the width, height values or device's pixel ratio
   */
  $: canvas?.width, canvas?.height, _width, _height, _pixelRatio, layerManager.redraw();

  /**
   * Dispatch "resize" event to the parent component each time _width, _height or _pixelRatio values of the canvas change
   */
  $: dispatch('resize', {
    width: _width,
    height: _height,
    pixelRatio: _pixelRatio,
  });

  $: layerMouseMoveHandler = useLayerEvents ? handleLayerMouseMove : null;
  $: layerTouchStartHandler = useLayerEvents ? handleLayerTouchStart : null;
  $: layerEventHandler = useLayerEvents ? handleEvent : null;
</script>

<svelte:window bind:devicePixelRatio />

<canvas
  bind:this={canvas}
  use:resize
  use:clickOutside={{ exclude: clickOutsideExcludedIds }}
  bind:clientWidth={canvasWidth}
  bind:clientHeight={canvasHeight}
  class={className}
  style:width={width ? `${width}px` : '100%'}
  style:height={height ? `${height}px` : '100%'}
  {style}
  on:outclick={handleClickOutside}
  on:mousemove={layerMouseMoveHandler}
  on:pointermove={layerMouseMoveHandler}
  on:touchstart={layerTouchStartHandler}
  on:click={layerEventHandler}
  on:contextmenu={layerEventHandler}
  on:dblclick={layerEventHandler}
  on:mousedown={layerEventHandler}
  on:mouseup={layerEventHandler}
  on:wheel={layerEventHandler}
  on:touchcancel={layerEventHandler}
  on:touchend={layerEventHandler}
  on:touchmove={layerEventHandler}
  on:pointerdown={layerEventHandler}
  on:pointerup={layerEventHandler}
  on:pointercancel={layerEventHandler}
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
/>

<div style:display="none" bind:this={layerContainer}>
  <slot />
</div>
