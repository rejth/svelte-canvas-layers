<script lang="ts">
  import { onMount } from 'svelte';
  import type { BoundingBox } from 'opentype.js';
  import type { Point } from 'core/interfaces';

  import Line from 'client/ui/Curve/Line.svelte';
  import BezierCurve from 'client/ui/Curve/BezierCurve.svelte';
  import ControlPoints from 'client/ui/Curve/ControlPoints.svelte';
  import { type CurveLayerEventDetails } from 'client/ui/Curve/interfaces';

  import CompoundPath from './CompoundPath.svelte';

  import { loadFont } from './font-utils';
  import {
    getBezierCurvePoint,
    getBezierCurveTangentVector,
    normalizeBezierCurveTangentVector,
  } from './geometry/math';
  import { COLORS } from 'client/shared/constants';

  let controlPoints: Point[] = [
    { x: 100, y: 300 }, // Start
    { x: 200, y: 200 }, // Control 1
    { x: 300, y: 200 }, // Control 2
    { x: 400, y: 300 }, // End
  ];

  let compoundPath: string = '';
  let letters: Array<{
    char: string;
    pathData: string;
    bbox: BoundingBox;
    xOffset: number;
    width: number;
  }> = [];

  const text = 'Sample Text';
  const fontSize = 100;

  onMount(async () => {
    try {
      // Get the full text path first to establish baseline
      const fullTextPath = await loadFont(text, { fontSize });
      const fullBbox = fullTextPath.getBoundingBox();

      // Now get individual letters
      let xOffset = 0;
      letters = [];

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === ' ') {
          xOffset += fontSize * 0.3;
          continue;
        }

        // Get individual letter
        const letterPath = await loadFont(char, { fontSize });
        const letterBbox = letterPath.getBoundingBox();
        const pathData = letterPath.toPathData(2);

        // Calculate letter width (approximate)
        const letterWidth = letterBbox.x2 - letterBbox.x1;

        letters.push({
          char,
          pathData,
          bbox: letterBbox,
          xOffset,
          width: letterWidth,
        });

        // Advance by letter width plus some spacing
        xOffset += letterWidth + fontSize * 0.05; // 5% spacing
      }

      // Set up control points based on total width
      const totalWidth = xOffset;
      const padding = 50;
      controlPoints[0] = { x: padding, y: 300 };
      controlPoints[1] = { x: totalWidth * 0.25 + padding, y: 200 };
      controlPoints[2] = { x: totalWidth * 0.75 + padding, y: 200 };
      controlPoints[3] = { x: totalWidth + padding, y: 300 };

      transformText();
    } catch (error) {
      console.error('Error loading font:', error);
    }
  });

  const transformText = () => {
    if (!letters.length) return;

    const totalWidth = letters[letters.length - 1].xOffset + letters[letters.length - 1].width;
    let transformedPaths: string[] = [];

    letters.forEach((letter) => {
      // Get position along curve for this letter's center
      const letterCenter = letter.xOffset + letter.width / 2;
      const t = Math.max(0, Math.min(1, letterCenter / totalWidth));

      // Get curve position and tangent
      const curvePoint = getBezierCurvePoint(t, controlPoints);
      const tangent = getBezierCurveTangentVector(t, controlPoints);
      const normalizedTangent = normalizeBezierCurveTangentVector(tangent);

      // Calculate rotation angle
      const angle = Math.atan2(normalizedTangent.y, normalizedTangent.x);

      // Transform the letter using matrix transformation
      const transformedPath = transformLetterWithMatrix(
        letter.pathData,
        curvePoint,
        angle,
        letter.bbox,
      );

      if (transformedPath && transformedPath.trim()) {
        transformedPaths.push(transformedPath);
      }
    });

    compoundPath = transformedPaths.join(' ');
    console.log('Number of transformed letters:', transformedPaths.length);
  };

  const transformLetterWithMatrix = (
    pathData: string,
    curvePoint: Point,
    angle: number,
    bbox: BoundingBox,
  ): string => {
    try {
      // Calculate letter center for rotation
      const centerX = (bbox.x2 + bbox.x1) / 2;
      const centerY = (bbox.y2 + bbox.y1) / 2;

      // Create transformation matrix
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Transform function for a point
      const transformPoint = (x: number, y: number): [number, number] => {
        // Translate to origin (relative to letter center)
        const relX = x - centerX;
        const relY = y - centerY;

        // Rotate
        const rotX = relX * cos - relY * sin;
        const rotY = relX * sin + relY * cos;

        // Translate to curve position
        const finalX = rotX + curvePoint.x;
        const finalY = rotY + curvePoint.y;

        return [finalX, finalY];
      };

      // Use regex to find and replace all coordinate pairs
      return pathData.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (match, x, y) => {
        const [newX, newY] = transformPoint(parseFloat(x), parseFloat(y));
        return `${newX.toFixed(2)} ${newY.toFixed(2)}`;
      });
    } catch (error) {
      console.error('Error transforming letter:', error);
      return '';
    }
  };

  const handlePointMove = (e: CustomEvent<CurveLayerEventDetails>) => {
    if (!e.detail) return;
    controlPoints[e.detail.index] = e.detail.point;
    transformText();
  };
</script>

<CompoundPath {compoundPath} />

<ControlPoints
  stroke={true}
  lineWidth={1}
  color={COLORS.WHITE}
  strokeColor={COLORS.CURVE}
  controlPoints={[...controlPoints]}
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
