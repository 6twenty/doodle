(function (qd, api) {

  // Constants
  // ---------

  var XMLNS = 'http://www.w3.org/2000/svg';
  var SVG   = document.getElementById('svg');

  // Classes
  // -------

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

  function DrawPath(state) {
    this.path = new Path();
    this.points = [];
    this.origin = state.pointer.clone();
    this.path.add(this.origin);
    this.d = 'M' + [ this.origin.x, this.origin.y ].join(',') + ' ';

    this.colour = state.colour;
    this.size = state.size;
    this.opacity = state.opacity;

    this.layer = qd.layer;
    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', this.colour);
    this.el.setAttribute('stroke-width', this.size);
    this.el.setAttribute('opacity', this.opacity);
    this.layer.insertBefore(this.el, null);
  }

  DrawPath.prototype = {
    update: function update(state) {
      if (this.end && state.pointer.equals(this.end)) return;
      this.end = state.pointer.clone();
      this.points.push(this.end);
      this.path.add(this.end);
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
      var threshold = Math.floor(this.size / 2) - 2;
      if (threshold < 0) threshold = 0;
      var step = this.size * 0.1;
      if (step < 1) step = 1;
      var previousOffset = 0;

      // Same curves, but in reverse, and closing the path
      var d = this.points.reverse().map(function map(point, i, points) {
        // Use control points (swapped) from `point` but destination from the *next* point
        var next = points[i+1];

        if (next) {
          // Tweak the coordinates to vary the path width
          var diff = Math.random() >= 0.5 ? step : -step;
          var offset = previousOffset + diff;
          if (Math.abs(offset) > threshold) {
            offset = previousOffset - (offset > 0 ? step : -step);
          }

          previousOffset = offset;
          point.cp1.x += offset;
          point.cp1.y += offset;
          point.cp2.x += offset;
          point.cp2.y += offset;
          next.x += offset;
          next.y += offset;
        } else {
          next = this.origin;
        }


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

    // Is drawing if mousedown (but not shiftdown)
    if (qd.state.mousedown && !qd.state.shiftdown && !qd.state.moving) {

      // If not previously drawing, set up path
      if (!qd.state.drawing) {
        qd.setupDraw();
        qd.state.drawing = true;
      }

      qd.handleDraw();

    // Is moving if mousedown (with shiftdown)
    } else if (qd.state.mousedown && qd.state.shiftdown && !qd.state.drawing) {

      if (!qd.state.moving) {
        qd.setupMove();
        qd.state.moving = true;
      }

      qd.handleMove();

    // If was previously drawing, cache the path
    } else if (qd.state.drawing) {

      qd.finishDraw();
      qd.state.drawing = false;

    } else if (qd.state.moving) {

      qd.finishMove();
      qd.state.moving = false;

    }

    // Infinite loop
    requestAnimationFrame(loop);

  });

  // State
  // -----

  qd.path = null;
  qd.paths = [];
  qd.redos = [];
  qd.layer = document.getElementById('layer-5');

  qd.state = {
    xy: [ 0, 0 ],
    offset: [ 0, 0 ],
    mousedown: false,
    shiftdown: false,
    drawing: false,
    pointer: new Point(),
    colour: '#000',
    size: 10,
    opacity: 1
  }

  // Handlers
  // --------

  qd.mouseup = function mouseup(e) {
    qd.state.mousedown = false;
    qd.state.shiftdown = false;
  }

  window.addEventListener('mouseup', qd.mouseup);
  window.addEventListener('mouseleave', qd.mouseup);

  qd.mousemove = function mousemove(e) {
    qd.state.shiftdown = e.shiftKey;
    qd.state.mousedown = e.which === 1;
    qd.state.xy = [ e.pageX, e.pageY ];
    qd.state.pointer.x = e.pageX + qd.state.offset[0];
    qd.state.pointer.y = e.pageY + qd.state.offset[1];
  }

  window.addEventListener('mousemove', qd.mousemove);
  window.addEventListener('mousedown', qd.mousemove);

  qd.setOffset = function setOffset(x, y) {
    qd.state.offset = [x, y];
    SVG.viewBox.baseVal.x = x;
    SVG.viewBox.baseVal.y = y;
  }

  qd.resize = function resize() {
    SVG.viewBox.baseVal.width = window.innerWidth;
    SVG.viewBox.baseVal.height = window.innerHeight;
  }

  window.addEventListener('resize', qd.resize);
  qd.resize();

  qd.keyevent = function keyevent(e) {
    qd.state.shiftdown = e.shiftKey;
    SVG.style.cursor = e.shiftKey ? 'move' : '';
  }

  window.addEventListener('keydown', qd.keyevent);
  window.addEventListener('keyup', qd.keyevent);

  // Drawing
  // -------

  qd.setupDraw = function setupDrawPath() {
    qd.redos = [];
    qd.path = new DrawPath(qd.state);
  }

  qd.handleDraw = function handleDraw() {
    qd.path.update(qd.state);
    qd.path.render();
  }

  qd.finishDraw = function finishDraw() {
    qd.path.update(qd.state);
    qd.path.simplify();
    qd.path.render();
    qd.paths.push(qd.path);
    qd.path = null;
  }

  // Moving
  // ------

  qd.setupMove = function setupMove() {
    if (!qd.state.moveOrigin) {
      var x = qd.state.xy[0] + qd.state.offset[0];
      var y = qd.state.xy[1] + qd.state.offset[1];
      qd.state.moveOrigin = [ x, y ];
    }
  }

  qd.handleMove = function handleMove() {
    var x = qd.state.xy[0] - qd.state.moveOrigin[0];
    var y = qd.state.xy[1] - qd.state.moveOrigin[1];
    qd.setOffset(-x, -y);
  }

  qd.finishMove = function finishMove() {
    qd.state.moveOrigin = null;
  }

  // API
  // ---

  api.undo = function () {
    var path = qd.paths.pop();
    if (!path) return;
    path.layer.removeChild(path.el);
    qd.redos.push(path);
  }

  api.redo = function () {
    var path = qd.redos.pop();
    if (!path) return;
    path.layer.insertBefore(path.el, null);
    qd.paths.push(path);
  }

  Object.defineProperties(api, {

    layer: {
      get: function () { return +qd.layer.id.split('-')[1]; },
      set: function (num) { qd.layer = document.getElementById('layer-' + num); }
    },

    color: {
      get: function () { return qd.state.colour; },
      set: function (colour) { qd.state.colour = colour; }
    },

    size: {
      get: function () { return qd.state.size; },
      set: function (size) { qd.state.size = size; }
    },

    opacity: {
      get: function () { return qd.state.opacity; },
      set: function (opacity) { qd.state.opacity = opacity; }
    }

  });

})(Object.create(null), window.app = Object.create(null));
