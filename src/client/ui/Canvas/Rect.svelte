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

  $: render = ({ renderer }: RenderProps) => {
    const rectEntity = $shapes.get(entityId) as BaseCanvasEntity<RectDrawOptions>;
    if (!rectEntity) return;

    renderer.fillRect({
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
      renderer.drawImage({ image: snapshot, ...textOptions });
    } else {
      const textToRender = textEntity.getPreparedText();
      const snapshot = renderer.renderTextSnapshot(textToRender, textOptions);
      textEntity.setSnapshot(snapshot || null);
    }
  };
</script>

<Layer {bounds} {render} />
