<script lang="ts">
import AnimatedLayer from './AnimatedLayer.svelte'
</script>

<AnimatedLayer
  name="Circle"
  render={({ ctx, width, height, active }) => {
    const radius = width * 0.1;

    ctx.translate(width * 0.15, height * 0.7);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd670';
    ctx.fill();

    ctx.strokeStyle = '#050505';
    ctx.lineWidth = Math.max(5, width * 0.007);
    ctx.stroke();

    if (active()) {
      ctx.stroke();
    }
  }}
/>
