import pathParser from '../path/parser';
import pathEncoder from '../path/encoder';
import pathTransform from '../path/transform';
import absoluteTransformer from '../path/transformers/absolute';
import shortToLongTransformer from '../path/transformers/short-to-long';
import hvzToLineTransformer from '../path/transformers/hvz-to-line';
import lineToCurveTransformer from '../path/transformers/line-to-curve';
import arcToCurveTransformer from '../path/transformers/arc-to-curve';

export function preparePaths(originalPath, curveType = 'q') {
  let path = pathParser(originalPath);

  path = pathTransform(path, absoluteTransformer());
  path = pathTransform(path, shortToLongTransformer());
  path = pathTransform(path, hvzToLineTransformer());
  path = pathTransform(path, lineToCurveTransformer(curveType));
  path = pathTransform(path, arcToCurveTransformer());

  let pathString = pathEncoder(path);

  return pathString;
}
