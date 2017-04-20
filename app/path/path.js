class Path {

  constructor(canvas, attrs) {
    this.canvas = canvas

    if (attrs) {
      this.initWithAttrs(canvas, attrs)
    } else {
      this.initWithCanvas(canvas)
    }

    this.error = this.size * 2.5 // Tolerance for smoothing
  }

  initWithCanvas(canvas) {
    this.layer = this.canvas.renderLayer.id
    this.points = []

    Object.keys(this.canvas.app.pen.attrs).forEach(attr => {
      this[attr] = this.canvas.app.pen.attrs[attr]
    })
  }

  initWithAttrs(canvas, attrs) {
    Object.keys(attrs).forEach(attr => {
      this[attr] = attrs[attr]
    })

    this.segments = this.segments.map(data => {
      const segment = new Segment()

      segment.point = new Point(data.point.x, data.point.y)

      if (data.handleIn) {
        segment.handleIn = new Point(data.handleIn.x, data.handleIn.y)
      }

      if (data.handleOut) {
        segment.handleOut = new Point(data.handleOut.x, data.handleOut.y)
      }

      return segment
    })
  }

  attrs() {
    return {
      layer: this.layer,
      size: this.size,
      colour: this.colour,
      opacity: this.opacity,
      mode: this.mode,
      segments: this.segments
    }
  }

  update() {
    const point = this.canvas.pointer

    if (this.end && point.equals(this.end)) {
      return
    }

    this.end = point.clone()
    this.points.push(this.end)
  }

  simplify() {
    const points = this.points
    const length = points.length

    this.segments = length > 0 ? [ new Segment(points[0].clone()) ] : []

    if (length > 1) {
      const first = 0
      const last = length - 1
      const tan1 = points[1].subtract(points[0]).normalize()
      const tan2 = points[length - 2].subtract(points[length - 1]).normalize()

      this.fitCubic(first, last, tan1, tan2)
    }

    delete this.points
  }

  fitCubic(first, last, tan1, tan2) {
    if (last - first === 1) {
      const pt1 = this.points[first]
      const pt2 = this.points[last]
      const dist = pt1.getDistance(pt2) / 3

      this.addCurve([pt1, pt1.add(tan1.normalize(dist)), pt2.add(tan2.normalize(dist)), pt2])

      return
    }

    const uPrime = this.chordLengthParameterize(first, last)
    let maxError = Math.max(this.error, this.error * this.error)

    let split = undefined

    for (let i = 0; i <= 4; i++) {
      const curve = this.generateBezier(first, last, uPrime, tan1, tan2)
      const max = this.findMaxError(first, last, curve, uPrime)

      if (max.error < this.error) {
        this.addCurve(curve)

        return
      }

      split = max.index

      if (max.error >= maxError) {
        break
      }

      this.reparameterize(first, last, uPrime, curve)

      maxError = max.error
    }

    const V1 = this.points[split - 1].subtract(this.points[split])
    const V2 = this.points[split].subtract(this.points[split + 1])
    const tanCenter = V1.add(V2).divide(2).normalize()

    this.fitCubic(first, split, tan1, tanCenter)
    this.fitCubic(split, last, tanCenter.negate(), tan2)
  }

  addCurve(curve) {
    const prev = this.segments[this.segments.length - 1]
    const segment = new Segment(curve[3].clone())

    prev.handleOut = curve[1].clone()
    segment.handleIn = curve[2].clone()

    this.segments.push(segment)
  }

  chordLengthParameterize(first, last) {
    const u = [0]

    for (let i = first + 1; i <= last; i++) {
      u[i - first] = u[i - first - 1] + this.points[i].getDistance(this.points[i - 1])
    }

    for (let i = 1, m = last - first; i <= m; i++) {
      u[i] /= u[m]
    }

    return u
  }

  generateBezier(first, last, uPrime, tan1, tan2) {
    let epsilon = 10e-12

    const pt1 = this.points[first]
    const pt2 = this.points[last]
    const C = [[0, 0], [0, 0]]
    const X = [0, 0]

    for (let i = 0, l = last - first + 1; i < l; i++) {
      const u = uPrime[i]
      const t = 1 - u
      const b = 3 * u * t
      const b0 = t * t * t
      const b1 = b * t
      const b2 = b * u
      const b3 = u * u * u
      const a1 = tan1.normalize(b1)
      const a2 = tan2.normalize(b2)
      const tmp = this.points[first + i].subtract(pt1.multiply(b0 + b1)).subtract(pt2.multiply(b2 + b3))

      C[0][0] += a1.dot(a1)
      C[0][1] += a1.dot(a2)
      C[1][0] = C[0][1]
      C[1][1] += a2.dot(a2)
      X[0] += a1.dot(tmp)
      X[1] += a2.dot(tmp)
    }

    const detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];

    let alpha1 = undefined
    let alpha2 = undefined

    if (Math.abs(detC0C1) > epsilon) {
      const detC0X = C[0][0] * X[1]    - C[1][0] * X[0]
      const detXC1 = X[0]    * C[1][1] - X[1]    * C[0][1]

      alpha1 = detXC1 / detC0C1
      alpha2 = detC0X / detC0C1
    } else {
      const c0 = C[0][0] + C[0][1]
      const c1 = C[1][0] + C[1][1]

      if (Math.abs(c0) > epsilon) {
        alpha1 = alpha2 = X[0] / c0
      } else if (Math.abs(c1) > epsilon) {
        alpha1 = alpha2 = X[1] / c1
      } else {
        alpha1 = alpha2 = 0
      }
    }

    const segLength = pt2.getDistance(pt1)

    epsilon *= segLength

    if (alpha1 < epsilon || alpha2 < epsilon) {
      alpha1 = alpha2 = segLength / 3
    }

    return [
      pt1,
      pt1.add(tan1.normalize(alpha1)),
      pt2.add(tan2.normalize(alpha2)),
      pt2
    ]
  }

  findMaxError(first, last, curve, u) {
    let index = Math.floor((last - first + 1) / 2)
    let maxDist = 0

    for (let i = first + 1; i < last; i++) {
      const P = this.evaluate(3, curve, u[i - first])
      const v = P.subtract(this.points[i])
      const dist = v.x * v.x + v.y * v.y

      if (dist >= maxDist) {
        maxDist = dist
        index = i
      }
    }

    return {
      error: maxDist,
      index: index
    }
  }

  evaluate(degree, curve, t) {
    const tmp = curve.slice()

    for (var i = 1; i <= degree; i++) {
      for (var j = 0; j <= degree - i; j++) {
        tmp[j] = tmp[j].multiply(1 - t).add(tmp[j + 1].multiply(t))
      }
    }

    return tmp[0]
  }

  reparameterize(first, last, u, curve) {
    for (var i = first; i <= last; i++) {
      u[i - first] = this.findRoot(curve, this.points[i], u[i - first])
    }
  }

  findRoot(curve, point, u) {
    const curve1 = []
    const curve2 = []

    for (var i = 0; i <= 2; i++) {
      curve1[i] = curve[i + 1].subtract(curve[i]).multiply(3)
    }

    for (var i = 0; i <= 1; i++) {
      curve2[i] = curve1[i + 1].subtract(curve1[i]).multiply(2)
    }

    const pt = this.evaluate(3, curve, u)
    const pt1 = this.evaluate(2, curve1, u)
    const pt2 = this.evaluate(1, curve2, u)
    const diff = pt.subtract(point)
    const df = pt1.dot(pt1) + diff.dot(pt2)

    if (Math.abs(df) < 10e-6) {
      return u
    }

    return u - diff.dot(pt1) / df
  }

}
