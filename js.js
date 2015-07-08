(function () {

  // Constants
  // ---------

  var XMLNS    = 'http://www.w3.org/2000/svg';
  var SVG      = document.getElementById('svg');
  var PEN      = document.getElementById('pen');
  var MATRIX   = SVG.createSVGMatrix();
  var POINT    = SVG.createSVGPoint();
  var HANDLERS = {};
  var COMMANDS = {};
  var API      = {};
  var STATE;

  // Helpers
  // -------

  function forEach(array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
      callback.call(scope, array[i], i, array);
    }
  }

  // https://gist.github.com/gre/1650294
  function easeOutQuint(t) {
    return 1+(--t)*t*t*t*t;
  }

  // Class: Segment
  // --------------

  function Segment(point) {
    this.point = point;
  }

  // Class: Point
  // ------------

  function Point(x, y) {
    this.x = x;
    this.y = y;
  }

  Point.prototype = {

    toString: function toString() {
      return [ this.x, this.y ].join(',');
    },

    clone: function clone() {
      return new Point(this.x, this.y);
    },

    equals: function equals(point) {
      return this === point || point && (this.x === point.x && this.y === point.y);
    },

    getLength: function getLength() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    getDistance: function getDistance(point) {
      var x = point.x - this.x;
      var y = point.y - this.y;
      var d = x * x + y * y;
      return Math.sqrt(d);
    },

    normalize: function normalize(length) {
      if (length === undefined) length = 1;
      var current = this.getLength();
      var scale = current !== 0 ? length / current : 0;
      var point = new Point(this.x * scale, this.y * scale);
      return point;
    },

    negate: function negate() {
      return new Point(-this.x, -this.y);
    },

    multiply: function multiply(n) {
      return new Point(this.x * n, this.y * n);
    },

    divide: function divide(n) {
      return new Point(this.x / n, this.y / n);
    },

    add: function add(point) {
      return new Point(this.x + point.x, this.y + point.y);
    },

    subtract: function subtract(point) {
      return new Point(this.x - point.x, this.y - point.y);
    },

    dot: function dot(point) {
      return this.x * point.x + this.y * point.y;
    }

  }

  // Class: Path
  // -----------

  function Path(attrs) {
    var point = STATE.pointer;
    if (point) this.points = [ point.clone() ];

    attrs = attrs || STATE;
    this.color   = attrs.color;
    this.size    = attrs.size;
    this.opacity = attrs.opacity;
    this.layer   = attrs.layer;
    this.d       = attrs.d;

    this.index = STATE.paths.length;
    this.error = this.size * 2.5; // Tolerance for smoothing

    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', this.color);
    this.el.setAttribute('stroke-width', this.size);
    this.el.setAttribute('opacity', this.opacity);
    this.el.setAttribute('class', 'path');
    if (this.d) this.el.setAttribute('d', this.d);
    this.layer.insertBefore(this.el, null);
  }

  Path.prototype = {

    toString: function toString() {
      return JSON.stringify({
        d:       this.d,
        color:   this.color,
        size:    this.size,
        opacity: this.opacity,
        layer:   this.layer.id
      });
    },

    play: function play() {
      window.requestAnimationFrame(function loop() {
        this.el.setAttribute('visibility', '');
        this._dashoffset -= 20;
        if (this._dashoffset < 0) this._dashoffset = 0;
        this.el.setAttribute('stroke-dashoffset', this._dashoffset + 'px');
        if (this._dashoffset === 0) {
        this.el.setAttribute('stroke-dasharray', '');
        this.el.setAttribute('stroke-dashoffset', '');
          var next = STATE.paths[this.index + 1];
          if (next) next.play();
        } else {
          window.requestAnimationFrame(loop.bind(this));
        }
      }.bind(this));
    },

    update: function update() {
      var point = STATE.pointer;
      if (this.end && point.equals(this.end)) return;
      this.end = point.clone();
      this.points.push(this.end);
    },

    render: function render() {
      var d  = '';
      var d_ = '';

      if (this.simplified) {

        // Variable width setup
        var threshold = Math.floor(this.size / 2);
        var step = Math.max(1, this.size * 0.1);
        var offset = 0;
        var reducing = false;
        var last = this.segments.length - 1;

        this.segments.forEach(function map(segment, i, segments) {
          if (i === 0) d += 'M';
          if (segment.handleIn) d += (segment.handleIn + ' ');
          d += (segment.point + ' ');
          if (segment.handleOut) d += ('C' + segment.handleOut + ' ');

          // Variable width offset
          if (i === 0 || i === last) {
            offset = 0;
          } else if (typeof reducing === 'number') {
            offset += reducing;
          } else if ((Math.abs(offset) / step) >= (last - i)) {
            reducing = reducing || (offset > 0 ? -step : step);
            offset += reducing;
          } else {
            var diff = Math.random() >= 0.5 ? step : -step;
            if (Math.abs(offset + diff) > threshold) diff *= -1;
            offset += diff;
          }

          // Variable width points
          var add = { x: offset, y: offset };
          segment.point_ = segment.point.add(add);
          if (segment.handleIn) segment.handleIn_ = segment.handleIn.add(add);
          if (segment.handleOut) segment.handleOut_ = segment.handleOut.add(add);

          if (i === 0) d_ += 'M';
          if (segment.handleIn_) d_ += (segment.handleIn_ + ' ');
          d_ += (segment.point_ + ' ');
          if (segment.handleOut_) d_ += ('C' + segment.handleOut_ + ' ');
        });

      } else {

        this.points.forEach(function map(point, i, points) {
          if (i === 0) d += 'M';
          d += point;
          if (i < points.length-1) d += ' L';
        });

      }

      if (d_) d += (' ' + d_);
      this.d = d;
      this.el.setAttribute('d', d);
    },

    simplify: function simplify() {
      var points = this.points;
      var length = points.length;
      this.segments = length > 0 ? [ new Segment(points[0].clone()) ] : [];

      if (length > 1) {
        var first = 0;
        var last  = length - 1;
        var tan1  = points[1].subtract(points[0]).normalize();
        var tan2  = points[length - 2].subtract(points[length - 1]).normalize();
        this.fitCubic(first, last, tan1, tan2);
      }

      delete this.points;
      this.simplified = true;
    },

    fitCubic: function fitCubic(first, last, tan1, tan2) {
      if (last - first == 1) {
        var pt1 = this.points[first];
        var pt2 = this.points[last];
        var dist = pt1.getDistance(pt2) / 3;
        this.addCurve([pt1, pt1.add(tan1.normalize(dist)), pt2.add(tan2.normalize(dist)), pt2]);
        return;
      }

      var uPrime = this.chordLengthParameterize(first, last);
      var maxError = Math.max(this.error, this.error * this.error);
      var split;

      for (var i = 0; i <= 4; i++) {
        var curve = this.generateBezier(first, last, uPrime, tan1, tan2);
        var max = this.findMaxError(first, last, curve, uPrime);
        if (max.error < this.error) {
          this.addCurve(curve);
          return;
        }
        split = max.index;
        if (max.error >= maxError) break;
        this.reparameterize(first, last, uPrime, curve);
        maxError = max.error;
      }

      var V1 = this.points[split - 1].subtract(this.points[split]);
      var V2 = this.points[split].subtract(this.points[split + 1]);
      var tanCenter = V1.add(V2).divide(2).normalize();

      this.fitCubic(first, split, tan1, tanCenter);
      this.fitCubic(split, last, tanCenter.negate(), tan2);
    },

    addCurve: function addCurve(curve) {
      var prev = this.segments[this.segments.length - 1];
      prev.handleOut = curve[1].clone();
      var segment = new Segment(curve[3].clone());
      segment.handleIn = curve[2].clone();
      this.segments.push(segment);
    },

    chordLengthParameterize: function chordLengthParameterize(first, last) {
      var u = [0];

      for (var i = first + 1; i <= last; i++) {
        u[i - first] = u[i - first - 1] + this.points[i].getDistance(this.points[i - 1]);
      }

      for (var i = 1, m = last - first; i <= m; i++) {
        u[i] /= u[m];
      }

      return u;
    },

    generateBezier: function generateBezier(first, last, uPrime, tan1, tan2) {
      var epsilon = 10e-12;
      var pt1 = this.points[first];
      var pt2 = this.points[last];
      var C = [[0, 0], [0, 0]];
      var X = [0, 0];

      for (var i = 0, l = last - first + 1; i < l; i++) {
        var u = uPrime[i];
        var t = 1 - u;
        var b = 3 * u * t;
        var b0 = t * t * t;
        var b1 = b * t;
        var b2 = b * u;
        var b3 = u * u * u;
        var a1 = tan1.normalize(b1);
        var a2 = tan2.normalize(b2);
        var tmp = this.points[first + i].subtract(pt1.multiply(b0 + b1)).subtract(pt2.multiply(b2 + b3));

        C[0][0] += a1.dot(a1);
        C[0][1] += a1.dot(a2);
        C[1][0] = C[0][1];
        C[1][1] += a2.dot(a2);
        X[0] += a1.dot(tmp);
        X[1] += a2.dot(tmp);
      }

      var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];
      var alpha1, alpha2;

      if (Math.abs(detC0C1) > epsilon) {
        var detC0X  = C[0][0] * X[1]    - C[1][0] * X[0];
        var detXC1  = X[0]    * C[1][1] - X[1]    * C[0][1];
        alpha1 = detXC1 / detC0C1;
        alpha2 = detC0X / detC0C1;
      } else {
        var c0 = C[0][0] + C[0][1];
        var c1 = C[1][0] + C[1][1];
        if (Math.abs(c0) > epsilon) {
          alpha1 = alpha2 = X[0] / c0;
        } else if (Math.abs(c1) > epsilon) {
          alpha1 = alpha2 = X[1] / c1;
        } else {
          alpha1 = alpha2 = 0;
        }
      }

      var segLength = pt2.getDistance(pt1);
      epsilon *= segLength;
      if (alpha1 < epsilon || alpha2 < epsilon) {
        alpha1 = alpha2 = segLength / 3;
      }

      return [pt1, pt1.add(tan1.normalize(alpha1)), pt2.add(tan2.normalize(alpha2)), pt2];
    },

    findMaxError: function findMaxError(first, last, curve, u) {
      var index = Math.floor((last - first + 1) / 2);
      var maxDist = 0;

      for (var i = first + 1; i < last; i++) {
        var P = this.evaluate(3, curve, u[i - first]);
        var v = P.subtract(this.points[i]);
        var dist = v.x * v.x + v.y * v.y;
        if (dist >= maxDist) {
          maxDist = dist;
          index = i;
        }
      }

      return {
        error: maxDist,
        index: index
      };
    },

    evaluate: function evaluate(degree, curve, t) {
      var tmp = curve.slice();

      for (var i = 1; i <= degree; i++) {
        for (var j = 0; j <= degree - i; j++) {
          tmp[j] = tmp[j].multiply(1 - t).add(tmp[j + 1].multiply(t));
        }
      }

      return tmp[0];
    },

    reparameterize: function reparameterize(first, last, u, curve) {
      for (var i = first; i <= last; i++) {
        u[i - first] = this.findRoot(curve, this.points[i], u[i - first]);
      }
    },

    findRoot: function findRoot(curve, point, u) {
      var curve1 = [];
      var curve2 = [];

      for (var i = 0; i <= 2; i++) {
        curve1[i] = curve[i + 1].subtract(curve[i]).multiply(3);
      }

      for (var i = 0; i <= 1; i++) {
        curve2[i] = curve1[i + 1].subtract(curve1[i]).multiply(2);
      }

      var pt   = this.evaluate(3, curve, u);
      var pt1  = this.evaluate(2, curve1, u);
      var pt2  = this.evaluate(1, curve2, u);
      var diff = pt.subtract(point);
      var df   = pt1.dot(pt1) + diff.dot(pt2);

      if (Math.abs(df) < 10e-6) return u;
      return u - diff.dot(pt1) / df;
    }

  }

  // Main loop
  // ---------

  requestAnimationFrame(function loop() {

    // Set zoom
    if (STATE.zooming) scale();

    // Is drawing if mousedown (but not shiftdown)
    if (STATE.active && !STATE.shift && !STATE.moving) {

      // If not previously drawing, set up path
      if (!STATE.drawing) {
        setupDraw();
        STATE.drawing = true;
      }

      handleDraw();

    // Is moving if mousedown (with shiftdown)
    } else if (STATE.active && STATE.shift && !STATE.drawing) {

      if (!STATE.moving) {
        setupMove();
        STATE.moving = true;
      }

      handleMove();

    // If was previously drawing, cache the path
    } else if (STATE.drawing) {

      finishDraw();
      STATE.drawing = false;

    } else if (STATE.moving) {

      finishMove();
      STATE.moving = false;

    }

    // Infinite loop
    requestAnimationFrame(loop);

  });

  // State
  // -----

  STATE = {
    x:         0,
    y:         0,
    path:      null,
    height:    window.innerHeight,
    width:     window.innerWidth,
    active:    false,
    shift:     false,
    drawing:   false,
    momentum:  false,
    paths:     [],
    redos:     [],
    touches:   [],
    layer:     document.getElementById('layer-5'),
    scale:     1
  }

  Object.defineProperties(STATE, {

    topLeft: {
      get: function () {
        POINT.x = 0;
        POINT.y = 0;
        var pt = POINT.matrixTransform(MATRIX.inverse());
        return new Point(pt.x, pt.y);
      }
    },

    bottomRight: {
      get: function () {
        POINT.x = STATE.width;
        POINT.y = STATE.height;
        var pt = POINT.matrixTransform(MATRIX.inverse());
        return new Point(pt.x, pt.y);
      }
    },

    pointer: {
      get: function () {
        POINT.x = STATE.x;
        POINT.y = STATE.y;
        var pt = POINT.matrixTransform(MATRIX.inverse());
        return new Point(pt.x, pt.y);
      }
    },

    _zoom: { value: 1, writable: true },
    zoom: {
      get: function () { return this._zoom; },
      set: function (zoom) {
        if (zoom <= 0.1 || zoom >= 10) return;
        this._zoom = zoom;
      }
    },

    _color: { value: '#000', writable: true },
    color: {
      get: function () { return this._color; },
      set: function (color) {
        this._color = color;
        var current = window.getComputedStyle(PEN)['background-color'];
        var split = current.replace(/[^\d,\.]/g, '').split(',');
        var currentOpacity = +split[3] || 1;
        PEN.style.backgroundColor = color;
        this.opacity = currentOpacity;
      }
    },

    _size: { value: 10, writable: true },
    size: {
      get: function () { return this._size; },
      set: function (size) {
        this._size = size;
        var width = (60 - (50 * ((size * 2) / 100))) / 2;
        PEN.style.borderWidth = width + 'px';
      }
    },

    _opacity: { value: 1, writable: true },
    opacity: {
      get: function () { return this._opacity; },
      set: function (opacity) {
        this._opacity = opacity;
        var current = window.getComputedStyle(PEN)['background-color'];
        var split = current.replace(/[^\d,]/g, '').split(',');
        split[3] = opacity;
        PEN.style.backgroundColor = 'rgba(' + split.join(',') + ')';
      }
    }

  });

  // Translate & scale
  // -----------------

  function translate(dx, dy) {
    MATRIX = MATRIX.translate(dx, dy);
    var point = STATE.topLeft;
    SVG.viewBox.baseVal.x = point.x;
    SVG.viewBox.baseVal.y = point.y;
    return point;
  }

  function scale() {
    var point = STATE.pointer;
    translate(point.x, point.y);
    MATRIX = MATRIX.scale(STATE.zoom);
    var topLeft = translate(-point.x, -point.y);
    var bottomRight = STATE.bottomRight;
    SVG.viewBox.baseVal.width = bottomRight.x - topLeft.x;
    SVG.viewBox.baseVal.height = bottomRight.y - topLeft.y;
  }

  // Handlers
  // --------

  HANDLERS.mousemove = function mousemove(e) {
    e.preventDefault();

    STATE.shift = e.shiftKey;
    STATE.active = e.which === 1;
    STATE.x = e.pageX;
    STATE.y = e.pageY;
  }

  window.addEventListener('mousemove', HANDLERS.mousemove);
  window.addEventListener('mousedown', HANDLERS.mousemove);

  HANDLERS.mouseend = function mouseup(e) {
    e.preventDefault();

    STATE.active = false;
    STATE.shift = false;
  }

  window.addEventListener('mouseup', HANDLERS.mouseend);
  window.addEventListener('mouseleave', HANDLERS.mouseend);

  HANDLERS.touchstart = function touchstart(e) {
    e.preventDefault();

    // If this is the first touch, wait a moment to see if
    // other touches are registered and then start drawing.
    // If multiple touches are registered then start panning/zooming.
    if (STATE.touches.length === 0) { // First touch(es)

      if (e.touches.length === 1) {

        var timer = setTimeout(function () {
          // Start drawing
          STATE.active = true;
          timer = null;
        }, 100);

      } else {

        STATE.active = true;
        STATE.shift = true;

      }

    } else if (timer) { // Subsequent touch(es)

      // Start panning/zooming
      clearTimeout(timer);
      timer = null;
      STATE.active = true;
      STATE.shift = true; // Panning

    }

    STATE.touches = e.touches;
    STATE.x = e.pageX;
    STATE.y = e.pageY;
  }

  window.addEventListener('touchstart', HANDLERS.touchstart);

  HANDLERS.touchmove = function touchmove(e) {
    e.preventDefault();

    STATE.x = e.pageX;
    STATE.y = e.pageY;

    if (STATE.zooming) clearTimeout(STATE.zooming);
    STATE.zoom = Math.pow(1.5, (e.scale - STATE.scale));
    STATE.scale = e.scale;
    STATE.zooming = setTimeout(function () {
      STATE.zooming = false;
    }, 200);
  }

  window.addEventListener('touchmove', HANDLERS.touchmove);

  HANDLERS.touchend = function touchend(e) {
    e.preventDefault();

    if (e.touches.length === 0) {
      STATE.touches = [];
      STATE.active = false;
      STATE.shift = false;
      STATE.scale = 1;
    }
  }

  window.addEventListener('touchend', HANDLERS.touchend);
  window.addEventListener('touchleave', HANDLERS.touchend);
  window.addEventListener('touchcancel', HANDLERS.touchend);

  HANDLERS.mousewheel = function mousewheel(e) {
    if (STATE.zooming) clearTimeout(STATE.zooming);
    STATE.zoom = Math.pow(1.1, (e.detail / 100));
    STATE.zooming = setTimeout(function () {
      STATE.zooming = false;
    }, 200);
  }

  window.addEventListener('mousewheel', HANDLERS.mousewheel);

  HANDLERS.resize = function resize() {
    STATE.width = window.innerWidth;
    STATE.height = window.innerHeight;
    STATE.zoom = 1;
    scale();
  }

  window.addEventListener('resize', HANDLERS.resize);
  HANDLERS.resize();

  HANDLERS.keyevent = function keyevent(e) {
    STATE.shift = e.shiftKey;
    SVG.style.cursor = e.shiftKey ? 'move' : '';
  }

  window.addEventListener('keydown', HANDLERS.keyevent);
  window.addEventListener('keyup', HANDLERS.keyevent);

  // Keyboard commands
  HANDLERS.keys = {
    117: 'undo',
    114: 'redo',
    // 99:  'color',
    // 111: 'opacity',
    // 115: 'size',
    // 108: 'layer',
    112: 'play'
  }

  HANDLERS.keypress = function keypress(e) {
    var command = HANDLERS.keys[e.which];
    if (command) COMMANDS[command]();
  }

  window.addEventListener('keypress', HANDLERS.keypress);

  // Drawing
  // -------

  function setupDraw() {
    if (STATE.momentum) STATE.momentum = false;

    STATE.redos = [];
    STATE.path = new Path();
  }

  function handleDraw() {
    STATE.path.update();
    STATE.path.render();
  }

  function finishDraw() {
    STATE.path.update();
    STATE.path.simplify();
    STATE.path.render();
    STATE.paths.push(STATE.path);
    sessionStorage.setItem('path_' + STATE.path.index, STATE.path);
    cleanupDraw();
  }

  function cleanupDraw() {
    STATE.path = null;
  }

  // Moving
  // ------

  function setupMove() {
    if (STATE.momentum) STATE.momentum = false;
    STATE.moveOrigin = STATE.pointer.clone();
    STATE.movePosition = new Point(STATE.x, STATE.y);
  }

  function handleMove() {
    var point = STATE.pointer.subtract(STATE.moveOrigin);
    translate(point.x, point.y);

    STATE._temp = STATE._temp || 0;
    STATE._temp++;
    if (STATE._temp === 10) {
      STATE.movePosition = new Point(STATE.x, STATE.y);
      STATE._temp = 0;
    }
  }

  function finishMove() {
    if (STATE.zooming) return cleanupMove();

    STATE.momentum = true;
    STATE.moveEnd = new Point(STATE.x, STATE.y);

    var first    = STATE.movePosition;
    var last     = STATE.moveEnd;
    var distance = last.subtract(first);
    var start    = Date.now();
    var duration = 500;

    window.requestAnimationFrame(function loop() {
      var time = Date.now() - start;
      if (!STATE.momentum || time > duration) return cleanupMove();

      var factor = easeOutQuint(time / duration);
      STATE.x = last.x + (distance.x * factor);
      STATE.y = last.y + (distance.y * factor);
      handleMove();
      STATE.x = STATE.moveEnd.x;
      STATE.y = STATE.moveEnd.y;

      window.requestAnimationFrame(loop);
    });
  }

  function cleanupMove() {
    STATE.momentum = false;
    STATE._temp = null;
  }

  // API
  // ---

  API.undo = function() {
    var path = STATE.paths.pop();
    if (!path) return;
    path.layer.removeChild(path.el);
    STATE.redos.push(path);
    sessionStorage.removeItem('path_' + path.index);
  }

  API.redo = function() {
    var path = STATE.redos.pop();
    if (!path) return;
    path.layer.insertBefore(path.el, null);
    STATE.paths.push(path);
    sessionStorage.setItem('path_' + path.index, path);
  }

  Object.defineProperties(API, {

    layer: {
      get: function () { return +STATE.layer.id.split('-')[1]; },
      set: function (num) { STATE.layer = document.getElementById('layer-' + num); }
    },

    color: {
      get: function () { return STATE.color; },
      set: function (color) { STATE.color = color; }
    },

    size: {
      get: function () { return STATE.size; },
      set: function (size) { STATE.size = size; }
    },

    opacity: {
      get: function () { return STATE.opacity; },
      set: function (opacity) { STATE.opacity = opacity; }
    }

  });

  // Commands
  // --------

  COMMANDS = {

    undo: API.undo,
    redo: API.redo,

    // color:   function () { modal('color');   },
    // opacity: function () { modal('opacity'); },
    // size:    function () { modal('size');    },
    // layer:   function () { modal('layer');   },

    play: function () {
      // Hide all
      STATE.paths.forEach(function (path) {
        if (!(length in path)) path.length = Math.ceil(path.el.getTotalLength());
        if (path.length === 0) path.el.setAttribute('visibility', 'hidden');
        path.el.setAttribute('stroke-dasharray', path.length + 'px');
        path.el.setAttribute('stroke-dashoffset', path.length + 'px');
        path._dashoffset = path.length;
      });

      // Animate in sequence
      STATE.paths[0].play();
    }

  }

  // Loading
  // -------

  var i = 0, path = sessionStorage.getItem('path_' + i);
  while (path) {
    path = JSON.parse(path);
    path.layer = document.getElementById(path.layer);
    path = new Path(path);
    STATE.paths.push(path);
    path = sessionStorage.getItem('path_' + ++i);
  }

})();
