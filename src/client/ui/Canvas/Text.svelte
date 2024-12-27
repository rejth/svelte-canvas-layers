<script lang="ts">
  import type { Bounds, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services/GeometryManager';
  import { Layer } from 'core/ui';

  import { canvasStore } from 'client/ui/Canvas/store';
  import { CanvasText } from 'client/ui/Canvas/CanvasText';

  export let entityId: string;
  export let bounds: Bounds;

  const { shapes } = canvasStore;

  $: render = ({ drawer, options }: RenderProps) => {
    const textEntity = $shapes.get(entityId);
    if (!textEntity || !(textEntity instanceof CanvasText)) return;

    const snapshot = textEntity.getSnapshot();
    const textOptions = {
      ...textEntity.getOptions(),
      ...geometryManager.getRectDimensionFromBounds(bounds),
    };

    if (snapshot) {
      drawer.drawImage({ image: snapshot, ...textOptions });
    } else {
      const textToRender = textEntity.getPreparedText();
      const snapshot = drawer.renderTextSnapshot(textToRender, textOptions, options);
      textEntity.setSnapshot(snapshot);
    }
  };
</script>

<Layer {bounds} {render} />
