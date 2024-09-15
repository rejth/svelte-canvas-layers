<script lang="ts">
  import Canvas from './ui/Canvas.svelte';
  import ResizableLayer from './ui/ResizableLayer.svelte';
  import Layer from './ui/Layer.svelte';
  import Zoom from './ui/Zoom/Zoom.svelte';
  import UndoRedo from './ui/UndoRedo/UndoRedo.svelte';
  import Toolbar from './ui/Toolbar/Toolbar.svelte';

  const path = [
    {
      x: 33,
      y: 45.013885498046875,
    },
    {
      x: 34,
      y: 46.013885498046875,
    },
    {
      x: 36,
      y: 48.013885498046875,
    },
    {
      x: 38,
      y: 52.013885498046875,
    },
    {
      x: 44,
      y: 62.013885498046875,
    },
    {
      x: 52,
      y: 72.01388549804688,
    },
    {
      x: 58,
      y: 83.01388549804688,
    },
    {
      x: 65,
      y: 93.01388549804688,
    },
    {
      x: 75,
      y: 104.01388549804688,
    },
    {
      x: 82,
      y: 113.01388549804688,
    },
    {
      x: 86,
      y: 119.01388549804688,
    },
    {
      x: 91,
      y: 124.01388549804688,
    },
    {
      x: 98,
      y: 133.01388549804688,
    },
    {
      x: 103,
      y: 137.01388549804688,
    },
    {
      x: 105,
      y: 140.01388549804688,
    },
    {
      x: 110,
      y: 145.01388549804688,
    },
    {
      x: 112,
      y: 147.01388549804688,
    },
    {
      x: 114,
      y: 150.01388549804688,
    },
    {
      x: 116,
      y: 153.01388549804688,
    },
    {
      x: 120,
      y: 155.01388549804688,
    },
    {
      x: 122,
      y: 157.01388549804688,
    },
    {
      x: 124,
      y: 159.01388549804688,
    },
    {
      x: 126,
      y: 162.01388549804688,
    },
    {
      x: 128,
      y: 164.01388549804688,
    },
    {
      x: 131,
      y: 165.01388549804688,
    },
    {
      x: 133,
      y: 166.01388549804688,
    },
    {
      x: 135,
      y: 168.01388549804688,
    },
    {
      x: 137,
      y: 169.01388549804688,
    },
    {
      x: 140,
      y: 170.01388549804688,
    },
    {
      x: 141,
      y: 172.01388549804688,
    },
    {
      x: 142,
      y: 173.01388549804688,
    },
    {
      x: 143,
      y: 173.01388549804688,
    },
    {
      x: 145,
      y: 174.01388549804688,
    },
    {
      x: 146,
      y: 175.01388549804688,
    },
    {
      x: 147,
      y: 175.01388549804688,
    },
    {
      x: 148,
      y: 176.01388549804688,
    },
    {
      x: 150,
      y: 176.01388549804688,
    },
    {
      x: 151,
      y: 176.01388549804688,
    },
    {
      x: 152,
      y: 177.01388549804688,
    },
    {
      x: 153,
      y: 177.01388549804688,
    },
    {
      x: 154,
      y: 178.01388549804688,
    },
    {
      x: 156,
      y: 179.01388549804688,
    },
    {
      x: 158,
      y: 182.01388549804688,
    },
    {
      x: 161,
      y: 184.01388549804688,
    },
    {
      x: 163,
      y: 186.01388549804688,
    },
    {
      x: 165,
      y: 188.01388549804688,
    },
    {
      x: 167,
      y: 190.01388549804688,
    },
    {
      x: 170,
      y: 193.01388549804688,
    },
    {
      x: 172,
      y: 195.01388549804688,
    },
    {
      x: 174,
      y: 196.01388549804688,
    },
    {
      x: 175,
      y: 197.01388549804688,
    },
    {
      x: 176,
      y: 197.01388549804688,
    },
    {
      x: 176,
      y: 198.01388549804688,
    },
    {
      x: 177,
      y: 198.01388549804688,
    },
    {
      x: 178,
      y: 199.01388549804688,
    },
    {
      x: 181,
      y: 202.01388549804688,
    },
    {
      x: 183,
      y: 204.01388549804688,
    },
    {
      x: 185,
      y: 206.01388549804688,
    },
    {
      x: 187,
      y: 209.01388549804688,
    },
    {
      x: 190,
      y: 213.01388549804688,
    },
    {
      x: 192,
      y: 215.01388549804688,
    },
    {
      x: 194,
      y: 217.01388549804688,
    },
    {
      x: 195,
      y: 218.01388549804688,
    },
    {
      x: 196,
      y: 219.01388549804688,
    },
    {
      x: 197,
      y: 219.01388549804688,
    },
  ];

  let colors = ['#70d6ff', '#ff70a6', '#a56eff'];
  const sort = (color: string) =>
    (colors = colors.sort((a, b) => (a === color ? 1 : b === color ? -1 : 0)));
</script>

<main>
  <Toolbar />
  <Canvas width={window.innerWidth} height={window.innerHeight}>
    {#each colors as color, i (color)}
      {@const c = (i + 1) * 85}
      <ResizableLayer
        initialBounds={{ x0: c, y0: c, x1: c + 180, y1: c + 180 }}
        on:mousedown={() => sort(color)}
        on:touchstart={() => sort(color)}
        let:bounds
      >
        <Layer
          render={({ ctx }) => {
            const { x0, y0, x1, y1 } = bounds;
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = color;
            ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctx.globalAlpha = 1;
          }}
        />
      </ResizableLayer>
    {/each}
    <ResizableLayer {path} let:bounds>
      <Layer
        render={({ ctx, geometry }) => {
          const { x, y, width, height } = geometry.getRectDimension(bounds);
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ffd670';
          ctx.fillRect(x, y, width, height);
          ctx.globalAlpha = 1;
        }}
      />
    </ResizableLayer>
  </Canvas>
  <UndoRedo />
  <Zoom />
</main>
