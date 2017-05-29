class Point {

  constructor(x, y) {
    this.x = x
    this.y = y
  }

  toString() {
    return [ this.x, this.y ].join(',')
  }

  clone() {
    return new Point(this.x, this.y)
  }

  equals(point) {
    return this === point || point && (this.x === point.x && this.y === point.y)
  }

  getLength() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  getDistance(point) {
    const x = point.x - this.x
    const y = point.y - this.y
    const d = x * x + y * y

    return Math.sqrt(d)
  }

  normalize(length) {
    if (length === undefined) {
      length = 1
    }

    const current = this.getLength()
    const scale = current !== 0 ? length / current : 0
    const point = new Point(this.x * scale, this.y * scale)

    return point
  }

  negate() {
    return new Point(-this.x, -this.y)
  }

  multiply(n) {
    return new Point(this.x * n, this.y * n)
  }

  divide(n) {
    return new Point(this.x / n, this.y / n)
  }

  add(point) {
    return new Point(this.x + point.x, this.y + point.y)
  }

  subtract(point) {
    return new Point(this.x - point.x, this.y - point.y)
  }

  dot(point) {
    return this.x * point.x + this.y * point.y
  }

}
