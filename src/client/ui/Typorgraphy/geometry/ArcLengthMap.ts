import type { Bezier } from './BezierCurve';

/**
 * Reparameterizes a curve by arc length
 **/
export class ArcLengthMap {
  npts: number;
  tmax: number;
  tmin: number;
  lenmap: number[];
  curve: Bezier;
  totalLen: number;
  offset: number;

  defaults = {
    npts: 40,
    tmin: -2,
    tmax: 2,
  };

  /**
   * Curve is a curve object where the method point (t) yields a point on the curve.
   * The constructor samples the parameter space between tmin and tmax with npts points
   **/
  constructor(curve: Bezier, npts?: number, tmin?: number, tmax?: number) {
    this.curve = curve;
    this.npts = npts ?? this.defaults.npts;
    this.tmin = tmin ?? this.defaults.tmin;
    this.tmax = tmax ?? this.defaults.tmax;
    this.lenmap = [];

    let p = curve.point(this.tmin);
    let d = 0;
    const dt = this.tmax - this.tmin;

    for (let i = 0; i <= this.npts; i++) {
      const t = this.tmin + (dt * i) / this.npts;
      const q = curve.point(t);
      const delta = p.dist(q);
      d += delta;
      this.lenmap[i] = d;
      p = q;
    }

    this.totalLen = d;
    this.offset = 0;
    this.offset = this.len(0);
  }

  /**
   * Returns the distance along the curve for a given t
   **/
  len(t: number) {
    const i = ((t - this.tmin) * this.npts) / (this.tmax - this.tmin);
    const j = ~~i;
    return this.lenmap[j] + (this.lenmap[j + 1] - this.lenmap[j]) * (i - j) - this.offset;
  }

  /**
   * Returns the (approximate) value of the curve parameter for the given arc length
   **/
  t(len: number) {
    len += this.offset;

    if (len < this.lenmap[0]) {
      return this.tmin;
    }
    if (len > this.lenmap[this.npts]) {
      return this.tmax;
    }

    let i = 0;
    let j = this.npts;

    // Do binary search
    while (j - i > 1) {
      const k = ~~((i + j) / 2);
      if (len < this.lenmap[k]) {
        j = k;
      } else {
        i = k;
      }
    }

    const dt = this.tmax - this.tmin;
    const k = i + (len - this.lenmap[i]) / (this.lenmap[j] - this.lenmap[i]);

    return this.tmin + (k * dt) / this.npts;
  }
}
