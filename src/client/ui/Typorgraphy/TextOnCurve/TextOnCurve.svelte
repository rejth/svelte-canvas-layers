<script lang="ts">
  import { onMount } from 'svelte';

  import Line from 'client/ui/Curve/Line.svelte';
  import BezierCurve from 'client/ui/Curve/BezierCurve.svelte';
  import ControlPoints from 'client/ui/Curve/ControlPoints.svelte';
  import { type CurveLayerEventDetails } from 'client/ui/Curve/interfaces';

  import { Vector } from '../geometry/Vector';
  import { Bezier } from '../geometry/BezierCurve';

  import Text from './Text.svelte';
  import { COLORS } from 'client/shared/constants';

  const text = 'Sample Text';
  const fontFamily = 'Modak';
  const fontSize = 100;

  let fontLoaded = false;
  let font = `${fontSize}px sans-serif`;

  let controlPoints: Vector[] = [
    new Vector(230.4, 388.8),
    new Vector(258, 191),
    new Vector(773, 139),
    new Vector(921.6, 388.8),
  ];

  const initialCurve = new Bezier(
    controlPoints[0],
    controlPoints[1],
    controlPoints[2],
    controlPoints[3],
  );

  const loadCustomFont = async () => {
    try {
      const fontFace = new FontFace(fontFamily, 'url(/fonts/Modak-Regular.ttf)', {
        style: 'normal',
        weight: 'normal',
      });

      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);

      await document.fonts.ready;

      const isFontReady = document.fonts.check(`${fontSize}px ${fontFamily}`);

      if (isFontReady) {
        font = `${fontSize}px ${fontFamily}, sans-serif`;
        fontLoaded = true;
      } else {
        throw new Error('Font failed to load properly');
      }
    } catch (error) {
      fontLoaded = true;
    }
  };

  onMount(() => {
    loadCustomFont();
  });

  const handlePointMove = (e: CustomEvent<CurveLayerEventDetails>) => {
    if (!e.detail) return;

    const { index, point } = e.detail;

    const vector = controlPoints[index];
    vector.set(new Vector(point.x, point.y));
    controlPoints[index] = vector;
  };

  $: curve = initialCurve.update(
    controlPoints[0],
    controlPoints[1],
    controlPoints[2],
    controlPoints[3],
  );
</script>

{#if fontLoaded}
  <Text {text} {curve} {font} />
{:else}
  <!-- Optional: Show loading state -->
  <div style="position: absolute; top: 10px; left: 10px; color: white; font-size: 14px;">
    Loading font...
  </div>
{/if}

<ControlPoints
  {controlPoints}
  stroke={true}
  lineWidth={1}
  color={COLORS.WHITE}
  strokeColor={COLORS.CURVE}
  on:point.move={handlePointMove}
>
  <BezierCurve
    start={controlPoints[0]}
    cp1={controlPoints[1]}
    cp2={controlPoints[2]}
    end={controlPoints[3]}
  />
  <Line start={controlPoints[0]} end={controlPoints[1]} lineWidth={1} />
  <Line start={controlPoints[2]} end={controlPoints[3]} lineWidth={1} />
</ControlPoints>
