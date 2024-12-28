<script lang="ts">
  import AnimatedLayer from './AnimatedLayer.svelte';
</script>

<AnimatedLayer
  name="Rect"
  render={({ ctx, renderer, width, height, active }) => {
    const rect = { x: width * 0.2, y: height * 0.14, width: width * 0.2, height: width * 0.12 };
    renderer.fillRect({ ...rect, color: 'tomato' });

    if (active()) {
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }}
/>
