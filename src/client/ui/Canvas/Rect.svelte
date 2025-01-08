<script lang="ts">
  import type { Bounds, RenderProps } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { ResizableLayerAction } from 'client/ui/ResizableLayer/interfaces';
  import { CanvasText } from 'client/ui/Canvas/CanvasText';
  import { canvasStore } from 'client/ui/Canvas/store';

  export let entityId: string;
  export let bounds: Bounds;
  export let scale: number;
  export let currentAction: ResizableLayerAction | null;

  const { shapes, textEditor } = canvasStore;

  $: render = ({ renderer }: RenderProps) => {
    const rect = $shapes.get(entityId) as BaseCanvasEntity<RectDrawOptions>;
    if (!rect) return;

    const dimension = geometryManager.getRectDimensionFromBounds(bounds);
    renderer.fillRect({ ...rect.getOptions(), ...dimension });

    if ($textEditor?.isEditable && $textEditor.anchorId === entityId) return;

    const text = rect.getOptions().editor;
    if (!text || !(text instanceof CanvasText)) return;

    const snapshot = text.getSnapshot();
    const drawOptions = { ...text.getOptions(), ...dimension };

    if ((rect.isSelected && currentAction === ResizableLayerAction.RESIZE) || !snapshot) {
      const textToRender = text.getPreparedText();
      const snapshot = renderer.renderTextSnapshot(textToRender, { ...drawOptions, scale });
      text.setSnapshot(snapshot || null);
    } else if (snapshot) {
      renderer.drawImage({ image: snapshot, ...drawOptions });
    }
  };
</script>

<Layer {bounds} {render} />
