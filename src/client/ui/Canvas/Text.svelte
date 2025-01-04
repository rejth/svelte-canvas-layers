<script lang="ts">
  import type { Bounds, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import type { TextDrawOptions } from 'client/ui/Canvas/CanvasText';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { CanvasText } from 'client/ui/Canvas/CanvasText';
  import { canvasStore } from 'client/ui/Canvas/store';

  export let entityId: string;
  export let bounds: Bounds;

  const { shapes } = canvasStore;

  $: render = ({ renderer }: RenderProps) => {
    const text = $shapes.get(entityId) as BaseCanvasEntity<TextDrawOptions>;
    if (!text || !(text instanceof CanvasText)) return;

    const snapshot = text.getSnapshot();
    const drawOptions = {
      ...text.getOptions(),
      ...geometryManager.getRectDimensionFromBounds(bounds),
    };

    if (snapshot) {
      renderer.drawImage({ image: snapshot, ...drawOptions });
    } else {
      const textToRender = text.getPreparedText();
      const snapshot = renderer.renderTextSnapshot(textToRender, drawOptions);
      text.setSnapshot(snapshot || null);
    }
  };
</script>

<Layer {bounds} {render} />
