(function (app) {

  // Notes
  // -----

  // - Need to freeze permanent points whose curves won't change
  // - May need to try to detect sharp change in direction, and
  //   force an additional point (or points) around the apex
  // - Make point.cp(num, x, y) function so that point instances get re-used

  // Constants
  // ---------

  var XMLNS = 'http://www.w3.org/2000/svg';
  var SVG   = document.getElementById('svg');

  // Classes
  // -------

  Point.prototype.release = function release() {
    Point.pool.push(this);
  }

  Point.prototype.toArray = function toArray() {
    return [ this.x, this.y ];
  }

  // L  x,y
  Point.prototype.lineTo = function lineTo() {
    return 'L' + this.toArray().join(',');
  }

  // C  c1x,c1y  c2x,c2y  x,y
  Point.prototype.curveTo = function curveTo() {
    var cp1 = this.cp1.toArray().join(',');
    var cp2 = this.cp2.toArray().join(',');
    var point = this.toArray().join(',');
    if (app.state.debug) this.debugCurveTo();
    return 'C' + [ cp1, cp2, point ].join(' ');
  }

  // TODO - ensure elements are properly reused
  Point.prototype.debugCurveTo = function debugCurveTo() {
    if (!this._el_cp1) {
      this._el_cp1 = document.createElementNS(XMLNS, 'circle');
      this._el_cp1.setAttribute('r', 5);
      this._el_cp1.setAttribute('fill', 'green');
      SVG.insertBefore(this._el_cp1, app.path.el);
    }

    if (!this.cp2_el) {
      this._el_cp2 = document.createElementNS(XMLNS, 'circle');
      this._el_cp2.setAttribute('r', 5);
      this._el_cp2.setAttribute('fill', 'green');
      SVG.insertBefore(this._el_cp2, app.path.el);
    }

    this._el_cp1.setAttribute('cx', this.cp1.x);
    this._el_cp2.setAttribute('cx', this.cp2.x);
    this._el_cp1.setAttribute('cy', this.cp1.y);
    this._el_cp2.setAttribute('cy', this.cp2.y);

    if (!this._el) {
      this._el = document.createElementNS(XMLNS, 'path');
      this._el.setAttribute('stroke', 'green');
      this._el.setAttribute('stroke-width', '1');
      SVG.insertBefore(this._el, app.path.el);
    }

    var d = 'M' + this.cp1.toArray().join(',') + ' L' + this.cp2.toArray().join(',');
    this._el.setAttribute('d', d);
  }

  Point.prototype.copy = function copy() {
    return Point.get(this.x, this.y, this.timestamp);
  }

  // Returns direction and velocity for `point`
  Point.prototype.motion = function motion(point) {
    if (!point) return;
    this.time = this.timestamp - point.timestamp;
    this.distance = this.getDistance(point);
    this.velocity = this.distance / this.time;
    this.angle = Math.atan2(point.y - this.y, point.x - this.x);
  }

  Point.pool = [];
  while (Point.pool.length < 1000) {
    Point.pool.push(new Point());
  }

  Point.get = function get(x, y, timestamp) {
    if (this.pool.length === 0) {
      var point = new Point(x, y);
      point.timestamp = timestamp;
      return point;
    } else {
      var point = this.pool.pop();
      point.set(x, y);
      point.timestamp = timestamp;
      return point;
    }
  }

  function DrawPath(origin, opts) {
    this.path = new Path();
    this.points = { live: [], permanent: [] };
    this.origin = origin.copy();
    this.endLive = this.origin;
    this.endPermanent = this.origin;
    this.d = 'M' + [ this.origin.x, this.origin.y ].join(',') + ' ';

    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', opts.colour);
    this.el.setAttribute('stroke-width', opts.size);
    this.el.setAttribute('opacity', opts.opacity);
    SVG.insertBefore(this.el, null);
  }

  DrawPath.prototype = {
    update: function update(point, setPermanent) {
      if (!setPermanent && point.equals(this.endLive)) return;
      this.endLive = point = point.copy();
      this.points.live.push(point);

      // Sets time, distance, velocity and angle
      point.motion(this.endPermanent);

      var threshold = (1 + point.velocity * 10) * 5;
      if (threshold < 5) threshold = 5;
      if (!setPermanent && point.distance < threshold) return;

      this.endPermanent = point;
      this.points.permanent.push(point);
      this.points.live = [];
    },

    render: function render() {
      var bezier = this.points.permanent.length > 1;
      if (bezier) this.generateCurves();

      var permanent = this.points.permanent.map(function mapPermanent(point) {
        return bezier ? point.curveTo() : point.lineTo();
      }).join(' ');

      var live = this.points.live.map(function mapLive(point) {
        return point.lineTo();
      }).join(' ');

      var d = this.d + [ permanent, live ].join(' ');
      this.el.setAttribute('d', d);
    },

    // Catmull-Rom
    generateCurves: function generateCurves() {
      this.points.permanent.every(this.generateCurve.bind(this));
    },

    // Index 0: point = origin (no previousPoint)
    // Index 1: point = points[0]
    // Index 2+: point = points[i-1]
    generateCurve: function generateCurve(point, i, points) {
      var previousPoint, nextPoint, farPoint;

      i -= 1;
      previousPoint = points[i-1];
      point = points[i];
      nextPoint = points[i+1];
      farPoint = points[i+2]

      if (i === -1) previousPoint = this.origin;
      if (i === -1) point = this.origin;
      if (i === 0) previousPoint = this.origin;
      farPoint = farPoint || nextPoint;

      var cp1x = Math.round((-previousPoint.x + 6 * point.x + nextPoint.x) / 6);
      var cp1y = Math.round((-previousPoint.y + 6 * point.y + nextPoint.y) / 6);
      nextPoint.cp1 = Point.get(cp1x, cp1y);

      var cp2x = Math.round((point.x + 6 * nextPoint.x - farPoint.x) / 6);
      var cp2y = Math.round((point.y + 6 * nextPoint.y - farPoint.y) / 6);
      nextPoint.cp2 = Point.get(cp2x, cp2y);

      return true;
    },

    simplify: function simplify() {
      var points = [ this.origin ].concat(this.points.permanent);
      this.path.setSegments(points);
      this.path.simplify(10);
      var segments = this.path.getSegments();

      var previousSegment = segments[0];
      for (var i=1, l=segments.length; i<l; i++) {
        var segment = segments[i];
        var x = segment.point.x;
        var y = segment.point.y;
        var x1 = previousSegment.point.x + previousSegment.handleOut.x;
        var y1 = previousSegment.point.y + previousSegment.handleOut.y;
        var x2 = segment.point.x + segment.handleIn.x;
        var y2 = segment.point.y + segment.handleIn.y;

        segment.point.cp1 = new Point(x1, y1);
        segment.point.cp2 = new Point(x2, y2);
        previousSegment = segment;
      }

      this.points.permanent = segments.map(function (segment) { return segment.point; });
      this.points.permanent.shift();
    }
  }

  // Main loop
  // ---------

  requestAnimationFrame(function loop() {

    // Is drawing if mousedown
    if (app.state.mousedown) {
      // Point timestamp
      app.state.pointer.timestamp = Date.now();

      // If not previously drawing, set up path
      if (!app.state.drawing) {
        app.setupDrawPath();
        app.state.drawing = true;
      }

      app.handleDraw();

    // If was previously drawing, cache the path
    } else if (app.state.drawing) {

      app.finishDraw();
      app.state.drawing = false;

    }

    // Infinite loop
    requestAnimationFrame(loop);

  });

  // State
  // -----

  app.path = null;
  app.paths = [];

  app.state = {
    debug: true,
    mousedown: false,
    drawing: false,
    pointer: new Point(),
    colour: '#000',
    size: 10,
    opacity: 1
  }

  if (app.state.debug) app.state.opacity *= 0.5;

  app.mouseup = function mouseup(e) {
    app.state.mousedown = false;
  }

  window.addEventListener('mouseup', app.mouseup);
  window.addEventListener('mouseleave', app.mouseup);

  app.mousemove = function mousemove(e) {
    app.state.mousedown = e.which === 1;
    app.state.pointer.x = e.pageX;
    app.state.pointer.y = e.pageY;
  }

  window.addEventListener('mousemove', app.mousemove);
  window.addEventListener('mousedown', app.mousemove);

  // Drawing
  // -------

  app.setupDrawPath = function setupDrawPath() {
    app.path = new DrawPath(app.state.pointer, {
      colour: app.state.colour,
      size: app.state.size,
      opacity: app.state.opacity
    });
  }

  app.handleDraw = function handleDraw() {
    app.path.update(app.state.pointer);
    app.path.render();
  }

  app.finishDraw = function finishDraw() {
    app.path.update(app.state.pointer, true);
    // app.path.simplify();
    app.path.render();
    app.paths.push(app.path);
    app.path = null;
  }

})({});
