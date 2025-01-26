<script lang="ts">
  import type { RenderProps, Bounds, RectDimension } from 'core/interfaces';
  import { geometryManager } from 'core/services';
  import { Layer } from 'core/ui';

  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { ResizableLayerAction } from 'client/ui/ResizableLayer/interfaces';
  import { CanvasText } from 'client/ui/Canvas/CanvasText';
  import { canvasStore } from 'client/ui/Canvas/store';
  import { COLORS } from 'client/shared/constants';

  export let bounds: Bounds;
  export let active: boolean;
  export let selectOnMakingConnection: boolean;

  export let entityId: string;
  export let scale: number;
  export let currentAction: ResizableLayerAction | null;

  const { shapes, textEditor } = canvasStore;

  $: renderRect = ({ renderer }: RenderProps) => {
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

  $: render = ({ ctx, renderer }: RenderProps) => {
    const rect = geometryManager.getRectDimensionFromBounds(bounds);

    renderRect({ ctx, renderer });

    ctx.globalAlpha = 0;
    renderer.fillRect(rect);
    ctx.globalAlpha = 1;

    if (active) {
      let dimension: RectDimension = {
        ...rect,
        x: rect.x - 5,
        y: rect.y - 5,
        width: rect.width + 10,
        height: rect.height + 10,
      };

      if (selectOnMakingConnection) {
        dimension = { ...rect };
      }

      renderer.strokeRect({
        ...dimension,
        color: selectOnMakingConnection ? '#000' : COLORS.SELECTION,
        lineWidth: 2,
      });
    }
  };
</script>

<Layer
  {bounds}
  {render}
  on:mouseenter
  on:mouseleave
  on:mousedown
  on:mouseup
  on:touchstart
  on:touchend
  on:dblclick
  on:click
/>
