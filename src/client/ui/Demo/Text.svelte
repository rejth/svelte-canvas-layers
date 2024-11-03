<script lang="ts">
  import AnimatedLayer from './AnimatedLayer.svelte';

  export let text: string;
  export let scale: number;
  export let opacity: number = 1;
  export let yOffset: number = 0;
</script>

<AnimatedLayer
  name="Text"
  render={({ ctx, width, height, active }) => {
    const size = width * scale;
    const offset = height * yOffset;

    ctx.font = `${size}px 'Fira Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dcdcdc';
    ctx.globalAlpha = opacity;
    ctx.fillText(text, width / 2, height / 2 + offset);

    const { width: w } = ctx.measureText(text);

    const rect = {
      x: width / 2 - w / 2,
      y: height / 2 - size / 2 + offset,
      width: w,
      height: size,
    };

    ctx.globalAlpha = 0;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.globalAlpha = 1;

    if (active()) {
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }}
/>
