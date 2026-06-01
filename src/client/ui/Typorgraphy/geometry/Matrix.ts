import { Vector } from './Vector';

export class Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  /**
   * Constructor from elements specified in column-wise order, i.e., "a" and "b" are the elements in the first
   * columnm, "c", "d" are the elements in the second column and "e", "f" the elements in the third column
   */
  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    [this.a, this.b, this.c, this.d, this.e, this.f] = [a, b, c, d, e, f];
  }

  /**
   * Builds a translation matrix
   */
  static translate(dx = 0, dy = 0) {
    return new Matrix(1, 0, 0, 1, dx, dy);
  }

  /**
   * Builds a scale matrix
   */
  static scale(sx = 1, sy = 1) {
    return new Matrix(sx, 0, 0, sy);
  }

  /**
   * Builds a shear (skew) matrix
   */
  static shear(sx = 0, sy = 0) {
    return new Matrix(1, sx, sy, 1);
  }

  /**
   * Builds a rotation matrix
   */
  static rotate(angle = 0) {
    const [s, c] = [Math.sin(angle), Math.cos(angle)];
    return new Matrix(c, s, -s, c);
  }

  /**
   * Returns a new vector, where the given vector is transformed by this matrix.
   * This method applies the complete transformation matrix.
   * Transform a point/position in space (like moving a dot from one location to another).
   */
  apply(vector: Vector) {
    return new Vector(
      this.a * vector.x + this.c * vector.y + this.e, // includes translation (e)
      this.b * vector.x + this.d * vector.y + this.f, // includes translation (f)
    );
  }

  /**
   * Returns a new vector, where the given vector is transformed by this matrix.
   * This method does not include translation (e and f). It's a direction-only transformation.
   * Transform a direction/velocity vector (like rotating which way something is pointing, but not changing its position).
   */
  applyVector(vector: Vector) {
    return new Vector(this.a * vector.x + this.c * vector.y, this.b * vector.x + this.d * vector.y);
  }

  /**
   * Returns a new matrix, where this matrix is multiplied by another matrix.
   * This is commonly used to combine transformations (like applying a rotation after a translation).
   */
  mult(matrix: Matrix) {
    return new Matrix(
      this.a * matrix.a + this.c * matrix.b,
      this.b * matrix.a + this.d * matrix.b,
      this.a * matrix.c + this.c * matrix.d,
      this.b * matrix.c + this.d * matrix.d,
      this.a * matrix.e + this.c * matrix.f + this.e,
      this.b * matrix.e + this.d * matrix.f + this.f,
    );
  }

  /**
   * Returns the inverse matrix.
   * The inverse matrix "undoes" the transformation represented by the original matrix.
   */
  inverse() {
    const { a, b, c, d, e, f } = this;

    let determinant = a * d - b * c;
    if (!determinant) {
      return null;
    }

    determinant = 1.0 / determinant;

    return new Matrix(
      d * determinant,
      -b * determinant,
      -c * determinant,
      a * determinant,
      (c * f - d * e) * determinant,
      (b * e - a * f) * determinant,
    );
  }
}
