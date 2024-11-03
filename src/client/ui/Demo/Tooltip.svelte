<script lang="ts">
  import { Layer } from 'core/ui';
  import { position, activeLayer } from './store';

  $: point = $position;
  $: text = `<${$activeLayer?.name} />`;
</script>

<Layer
  render={({ ctx }) => {
    const size = 17;
    const tooltipX = point.x + size;
    const tooltipY = point.y + size;

    ctx.font = `${size}px 'Fira Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const { width: w } = ctx.measureText(text);
    const rect = { x: tooltipX - 2, y: tooltipY - 2, width: w + 4, height: size + 4 };

    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillText(text, tooltipX, tooltipY);
  }}
/>
