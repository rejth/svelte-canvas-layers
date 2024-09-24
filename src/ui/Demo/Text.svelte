<script>
  import AnimatedLayer from './AnimatedLayer.svelte';

  export let text,
    scale,
    opacity = 1,
    yOffset = 0;
</script>

<AnimatedLayer
  name="Text"
  render={({ context, width, height, active }) => {
    const size = width * scale;
    const offset = height * yOffset;

    context.font = `${size}px 'Fira Mono', monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#dcdcdc';
    context.globalAlpha = opacity;
    context.fillText(text, width / 2, height / 2 + offset);

    const { width: w } = context.measureText(text);
    const rect = { x: width / 2 - w / 2, y: height / 2 - size / 2 + offset, width: w, height: size };

    context.globalAlpha = 0;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.globalAlpha = 1;

    if (active()) {
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }}
/>
