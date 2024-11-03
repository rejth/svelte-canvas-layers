<script lang="ts">
  import AnimatedLayer from './AnimatedLayer.svelte';
</script>

<AnimatedLayer
  name="Circle"
  render={({ ctx, drawer, width, height, active }) => {
    drawer.fillCircle({ x: 0, y: 0, radius: width * 0.1, color: '#ffd670' });

    if (active()) {
      ctx.stroke();
    }
  }}
/>
