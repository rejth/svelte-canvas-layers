<script lang="ts">
  import { spring, tweened } from 'svelte/motion';
  import { quadInOut as easing } from 'svelte/easing';

  import { coords, activeLayer, type Render } from './store';
  import Layer from '../Layer.svelte';
  import type { CanvasContextType, RenderProps } from '../../lib';

  export let name: string;
  export let render: Render;

  const id = Symbol();

  const styleTween = (initial: number) => {
    const tween = tweened(initial, { duration: 250, easing });
    return {
      subscribe: tween.subscribe,
      set: (value: number) => tween.set(value, { delay: Math.random() * 50 + 10 }),
    };
  };

  const blur = styleTween(0);
  const saturation = styleTween(1);
  const opacity = styleTween(1);
  const scale = spring(1, { stiffness: 0.1, damping: 0.2 });

  $: active = $activeLayer?.id === id;
  $: inactive = $activeLayer?.id && !active;

  $: blur.set(inactive ? 0.018 : 0);
  $: saturation.set(inactive ? 0.4 : 1);
  $: opacity.set(inactive ? 0.5 : 1);
  $: scale.set(!$activeLayer?.id ? 1 : (!active ? 0.95 : 1.1) + Math.random() / 10);

  $: point = $coords;

  $: styleActive = (context: CanvasContextType) => () => {
    if (active) {
      context.setLineDash([4, 4]);
      context.strokeStyle = '#dcdcdc';
      context.lineWidth = 2;
    }

    return active;
  };

  $: _render = ({ context, options }: RenderProps) => {
    const { width, height } = options;
    context.save();

    context.translate(point.x, point.y);
    context.scale($scale, $scale);
    context.translate(-point.x, -point.y);
    context.globalAlpha = $opacity;
    context.filter = `blur(${width * $blur}px) saturate(${$saturation * 100}%)`;
    render({ context, width, height, active: styleActive(context) });

    context.restore();
  };
</script>

<Layer
  render={_render}
  on:pointerenter={() => ($activeLayer = { name, id })}
  on:touchstart={() => ($activeLayer = { name, id })}
  on:pointerleave={() => ($activeLayer = null)}
  on:touchend={() => ($activeLayer = null)}
  on:pointerdown={() => scale.set(0.95)}
  on:pointerup={() => scale.set(1.1)}
/>
