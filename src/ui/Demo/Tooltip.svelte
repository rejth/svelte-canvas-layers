<script>
  import Layer from 'ui/Layer.svelte';
  import { coords, activeLayer } from './store';

  $: point = $coords;
  $: text = `<${$activeLayer?.name} />`;
</script>

<Layer
  render={({ context }) => {
    const size = 17;
    const tooltipX = point.x + size;
    const tooltipY = point.y + size;

    context.font = `${size}px 'Fira Mono', monospace`;
    context.textAlign = 'left';
    context.textBaseline = 'top';

    const { width: w } = context.measureText(text);
    const rect = { x: tooltipX - 2, y: tooltipY - 2, width: w + 4, height: size + 4 };

    context.fillStyle = '#fff';
    context.globalAlpha = 0.9;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);

    context.globalAlpha = 1;
    context.fillStyle = '#000';
    context.fillText(text, tooltipX, tooltipY);
  }}
/>
