<script lang="ts">
  import type { Bounds, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { CanvasText } from 'client/ui/Canvas/CanvasText';
  import { canvasStore } from 'client/ui/Canvas/store';

  export let entityId: string;
  export let bounds: Bounds;

  const { shapes, textEditor } = canvasStore;

  $: render = ({ drawer, options }: RenderProps) => {
    const rectEntity = $shapes.get(entityId) as BaseCanvasEntity<RectDrawOptions>;
    if (!rectEntity) return;

    drawer.fillRect({
      ...rectEntity.getOptions(),
      ...geometryManager.getRectDimensionFromBounds(bounds),
    });

    if ($textEditor?.isEditable && $textEditor.anchorId === entityId) return;

    const textEntity = rectEntity.getOptions().editor;
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
