<script lang="ts">
  import { canvasStore } from 'client/ui/Canvas/store';
  import { toolbarStore } from 'client/ui/Toolbar/store';
  import { Tools } from 'client/shared/interfaces';
  import { CanvasRect, type RectDrawOptions } from 'client/ui/Canvas/CanvasRect';

  const { shapes, selectedShapes } = canvasStore;

  let commandPressed = false;
  let clipboard: CanvasRect[] = [];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Backspace' && $selectedShapes.size > 0) {
      canvasStore.deleteShapes();
      canvasStore.resetTextEditor();
      toolbarStore.changeTool(Tools.NOTE);
    }

    if (event.key === 'Escape' && $selectedShapes.size > 0) {
      canvasStore.resetSelectedShapes();
      canvasStore.resetSelection();
      canvasStore.resetTextEditor();
    }

    if (event.key === 'Meta') {
      commandPressed = true;
    }

    if (event.key === 'a' && $shapes.size > 0) {
      canvasStore.selectAllShapes();
      clipboard = [];
    }

    if (event.key === 'c' && $selectedShapes.size > 0 && (commandPressed || event.ctrlKey)) {
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
