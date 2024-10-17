<script lang="ts">
  import AnimatedLayer from './AnimatedLayer.svelte';
</script>

<AnimatedLayer
  name="Rect"
  render={({ context, width, height, active }) => {
    const rect = { x: width * 0.2, y: height * 0.14, width: width * 0.2, height: width * 0.12 };
    context.fillStyle = 'tomato';
    context.fillRect(rect.x, rect.y, rect.width, rect.height);

    if (active()) {
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }}
/>
