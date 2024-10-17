<script lang="ts">
  import AnimatedLayer from './AnimatedLayer.svelte';
</script>

<AnimatedLayer
  name="Circle"
  render={({ context, width, height, active }) => {
    context.fillStyle = '#ffd670';
    context.translate(width * 0.15, height * 0.7);
    context.beginPath();
    context.arc(0, 0, width * 0.1, 0, 2 * Math.PI);
    context.fill();

    if (active()) {
      context.stroke();
    }
  }}
/>
