<script lang="ts">
  import { canvasStore } from 'client/ui/Canvas/store';
  import { toolbarStore } from 'client/ui/Toolbar/store';
  import { Tools } from 'client/shared/interfaces';
  import { CanvasRect, type RectDrawOptions } from 'client/ui/Canvas/CanvasRect';

  const { shapes, selectedShapes, textEditor } = canvasStore;

  let commandPressed = false;
  let clipboard: CanvasRect[] = [];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Backspace') {
      if ($selectedShapes.size > 0 && !$textEditor) {
        canvasStore.deleteShapes();
        canvasStore.resetTextEditor();
        toolbarStore.changeTool(Tools.NOTE);
      }
    }

    if (event.key === 'Escape') {
      if ($selectedShapes.size > 0) {
        canvasStore.resetSelectedShapes();
        canvasStore.resetSelection();
        canvasStore.resetTextEditor();
      }
    }

    if (event.key === 'Meta') {
      commandPressed = true;
    }

    if (event.key === 'a') {
      if ($shapes.size > 0 && !$textEditor) {
        canvasStore.selectAllShapes();
        clipboard = [];
      }
    }

    if (event.key === 'c' && (commandPressed || event.ctrlKey)) {
      if ($selectedShapes.size > 0 && !$textEditor) {
        for (const shape of $selectedShapes.values()) {
          const drawOptions = shape.getOptions() as RectDrawOptions;
          clipboard.push(
            new CanvasRect({
              ...drawOptions,
              x: drawOptions.x + 100,
              y: drawOptions.y + 100,
            }),
          );
        }
      }
    }

    if (event.key === 'v' && (commandPressed || event.ctrlKey) && clipboard.length > 0) {
      canvasStore.addShapes(new Map(clipboard.map((shape) => [shape.id, shape])));
    }
  };

  const handleKeyUp = () => {
    commandPressed = false;
    clipboard = [];
  };
</script>

<svelte:document on:keydown={handleKeyDown} on:keyup={handleKeyUp} />
