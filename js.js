(function (app) {

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
    return 'C' + [ cp1, cp2, point ].join(' ');
  }

  function DrawPath(origin, opts) {
    this.path = new Path();
    this.points = [];
    this.origin = origin.clone();
    this.path.add(this.origin);
    this.end = this.origin;
    this.d = 'M' + [ this.origin.x, this.origin.y ].join(',') + ' ';

    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', opts.colour);
    this.el.setAttribute('stroke-width', opts.size);
    this.el.setAttribute('opacity', opts.opacity);
    SVG.insertBefore(this.el, null);
  }

  DrawPath.prototype = {
    update: function update(point, setPermanent) {
      if (point.equals(this.end)) return;
      this.end = point = point.clone();
      this.points.push(point);
      this.path.add(point);
    },

    render: function render() {
      var d = this.d + this.points.map(function map(point, i, points) {
        return this.simplified ? point.curveTo() : point.lineTo();
      }.bind(this)).join(' ');

      if (this.simplified && this.points.length > 1) {
        d += this.renderReverse();
      }

      this.el.setAttribute('d', d);
    },

    renderReverse: function renderReverse() {
      // Same curves, but in reverse, and closing the path
      var d = this.points.reverse().map(function map(point, i, points) {
        // Use control points (swapped) from `point` but destination from the *next* point
        var next = points[i+1];
        if (!next) next = this.origin;

        var cp1 = point.cp2.toArray().join(',');
        var cp2 = point.cp1.toArray().join(',');
        var target = next.toArray().join(',');
        return 'C' + [ cp1, cp2, target ].join(' ');
      }.bind(this)).join(' ');

      return ' ' + d + 'z';
    },

    simplify: function simplify() {
      this.simplified = true;
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

        segment.point = new Point(segment.x, segment.y);
        segment.point.cp1 = new Point(x1, y1);
        segment.point.cp2 = new Point(x2, y2);
        previousSegment = segment;
      }

      this.points = segments.map(function (segment) { return segment.point; });
      this.points.shift(); // First segment is the origin
    }
  }

  // Main loop
  // ---------

  requestAnimationFrame(function loop() {

    // Is drawing if mousedown
    if (app.state.mousedown) {
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
    mousedown: false,
    drawing: false,
    pointer: new Point(),
    colour: '#000',
    size: 10,
    opacity: 1
  }

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
    app.path.simplify();
    app.path.render(true);
    app.paths.push(app.path);
    app.path = null;
  }

})({});
