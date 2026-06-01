import pathParser from './path/parser';
import pathEncoder from './path/encoder';
import { arcLengthDistance, euclideanDistance } from './path/interpolate';

import warpTransform from './warp/transform';
import warpInterpolate from './warp/interpolate';
import warpExtrapolate from './warp/extrapolate';

import { preparePaths } from './path/normalize';

export class Warp {
  constructor(originalPath, curveType = 'q') {
    const pathString = preparePaths(originalPath, curveType);

    const pathData = pathParser(pathString);
    this.paths = [{ pathData, pathString }];
  }

  get pathString() {
    return this.paths[0].pathString;
  }

  get pathData() {
    return this.paths[0].pathData;
  }

  resetPath(pathData, pathString, index = 0) {
    this.paths[index] = { pathData, pathString };
  }

  update() {
    for (const path of this.paths) {
      const pathString = pathEncoder(path.pathData);
      path.pathString = pathString;
    }

    return this.paths;
  }

  transform(transformers) {
    transformers = Array.isArray(transformers) ? transformers : [transformers];

    for (const path of this.paths) {
      path.pathData = warpTransform(path.pathData, transformers);
    }

    return this.update();
  }

  interpolate(threshold) {
    let didWork = false;

    function deltaFunction(points) {
      const linearPoints = [points[0].slice(0, 2), points[points.length - 1].slice(0, 2)];

      const delta = arcLengthDistance(linearPoints);
      didWork = didWork || delta > threshold;

      return delta;
    }

    for (const path of this.paths) {
      path.pathData = warpInterpolate(path.pathData, threshold, deltaFunction);
    }

    return didWork;
  }

  extrapolate(threshold) {
    let didWork = false;

    function deltaFunction(points) {
      const linearPoints = [points[0].slice(0, 2), points[points.length - 1].slice(0, 2)];

      const delta = arcLengthDistance(linearPoints);
      didWork = didWork || delta <= threshold;

      return delta;
    }

    for (const path of this.paths) {
      path.pathData = warpExtrapolate(path.pathData, threshold, deltaFunction);
    }

    return didWork;
  }

  preInterpolate(transformer, threshold) {
    let didWork = false;

    function deltaFunction(points) {
      const linearPoints = [points[0].slice(0, 2), points[points.length - 1].slice(0, 2)];

      const delta = arcLengthDistance(linearPoints);
      didWork = didWork || delta > threshold;

      return delta;
    }

    for (const path of this.paths) {
      const transformed = warpTransform(path.pathData, function (points) {
        const newPoints = transformer(points.slice(0, 2));
        newPoints.push(...points);

        return newPoints;
      });

      const interpolated = warpInterpolate(transformed, threshold, deltaFunction);

      path.pathData = warpTransform(interpolated, (points) => points.slice(2));
    }

    return didWork;
  }

  preExtrapolate(transformer, threshold) {
    let didWork = false;

    function deltaFunction(points) {
      const linearPoints = [points[0].slice(0, 2), points[points.length - 1].slice(0, 2)];

      const delta = arcLengthDistance(linearPoints);
      didWork = didWork || delta <= threshold;

      return delta;
    }

    for (const path of this.paths) {
      const transformed = warpTransform(path.pathData, function (points) {
        const newPoints = transformer(points.slice(0, 2));
        newPoints.push(...points);

        return newPoints;
      });

      const extrapolated = warpExtrapolate(transformed, threshold, deltaFunction);

      path.pathData = warpTransform(extrapolated, (points) => points.slice(2));
    }

    return didWork;
  }
}
