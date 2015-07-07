(function () {

  // Constants
  // ---------

  var XMLNS    = 'http://www.w3.org/2000/svg';
  var SVG      = document.getElementById('svg');
  var PEN      = document.getElementById('pen');
  var MODAL    = document.getElementById('modal');
  var MATRIX   = SVG.createSVGMatrix();
  var POINT    = SVG.createSVGPoint();
  var HANDLERS = {};
  var COMMANDS = {};
  var API      = {};

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

  function tap(func, context) {
    return function () {
      (context || window).addEventListener('touchend', func);
      setTimeout(function () { (context || window).removeEventListener('touchend', func); }, 200);
    }
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

  function Path(state) {
    var point = state.pointer.clone();
    this.points = [ point ];

    this.color = state.color;
    this.size = state.size;
    this.opacity = state.opacity;

    this.error = this.size * 2.5; // Tolerance for smoothing

    this.layer = state.layer;
    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', this.color);
    this.el.setAttribute('stroke-width', this.size);
    this.el.setAttribute('opacity', this.opacity);
    this.el.setAttribute('class', 'path');
    this.layer.insertBefore(this.el, null);
  }

  Path.prototype = {

    play: function play() {
      window.requestAnimationFrame(function loop() {
        this._dashoffset -= 20;
        if (this._dashoffset < 0) this._dashoffset = 0;
        this.el.setAttribute('stroke-dashoffset', this._dashoffset + 'px');
        if (this._dashoffset === 0) {
        this.el.setAttribute('stroke-dasharray', '');
        this.el.setAttribute('stroke-dashoffset', '');
          var next = state.paths[this.index + 1];
          if (next) next.play();
        } else {
          window.requestAnimationFrame(loop.bind(this));
        }
      }.bind(this));
    },

    update: function update(state) {
      var point = state.pointer;
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
    if (state.zooming) scale();

    // Is drawing if mousedown (but not shiftdown)
    if (state.mousedown && !state.shiftdown && !state.moving) {

      // If not previously drawing, set up path
      if (!state.drawing) {
        setupDraw();
        state.drawing = true;
      }

      handleDraw();

    // Is moving if mousedown (with shiftdown)
    } else if (state.mousedown && state.shiftdown && !state.drawing) {

      if (!state.moving) {
        setupMove();
        state.moving = true;
      }

      handleMove();

    // If was previously drawing, cache the path
    } else if (state.drawing) {

      finishDraw();
      state.drawing = false;

    } else if (state.moving) {

      finishMove();
      state.moving = false;

    }

    // Infinite loop
    requestAnimationFrame(loop);

  });

  // State
  // -----

  var state = {
    x:         0,
    y:         0,
    path:      null,
    height:    window.innerHeight,
    width:     window.innerWidth,
    mousedown: false,
    shiftdown: false,
    drawing:   false,
    momentum:  false,
    paths:     [],
    redos:     [],
    layer:     document.getElementById('layer-5')
  }

  Object.defineProperties(state, {

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
        POINT.x = state.width;
        POINT.y = state.height;
        var pt = POINT.matrixTransform(MATRIX.inverse());
        return new Point(pt.x, pt.y);
      }
    },

    pointer: {
      get: function () {
        POINT.x = state.x;
        POINT.y = state.y;
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
    var point = state.topLeft;
    SVG.viewBox.baseVal.x = point.x;
    SVG.viewBox.baseVal.y = point.y;
    return point;
  }

  function scale() {
    var point = state.pointer;
    translate(point.x, point.y);
    MATRIX = MATRIX.scale(state.zoom);
    var topLeft = translate(-point.x, -point.y);
    var bottomRight = state.bottomRight;
    SVG.viewBox.baseVal.width = bottomRight.x - topLeft.x;
    SVG.viewBox.baseVal.height = bottomRight.y - topLeft.y;
  }

  // Handlers
  // --------

  HANDLERS.mouseup = function mouseup(e) {
    state.mousedown = false;
    state.shiftdown = false;
  }

  window.addEventListener('mouseup', HANDLERS.mouseup);
  window.addEventListener('mouseleave', HANDLERS.mouseup);
  window.addEventListener('touchend', HANDLERS.mouseup);
  window.addEventListener('touchleave', HANDLERS.mouseup);
  window.addEventListener('touchcancel', HANDLERS.mouseup);

  HANDLERS.mousemove = function mousemove(e) {
    e.preventDefault();
    state.shiftdown = e.shiftKey;
    state.mousedown = e.buttons === 1 || (/^touch/).test(e.type);
    state.x = e.pageX;
    state.y = e.pageY;
  }

  window.addEventListener('mousemove', HANDLERS.mousemove);
  window.addEventListener('mousedown', HANDLERS.mousemove);
  window.addEventListener('touchmove', HANDLERS.mousemove);
  window.addEventListener('touchstart', HANDLERS.mousemove);

  HANDLERS.mousewheel = function mousewheel(e) {
    if (state.zooming) clearTimeout(state.zooming);
    state.zoom = Math.pow(1.1, (e.detail / 100));
    state.zooming = setTimeout(function () {
      state.zooming = false;
    }, 200);
  }

  window.addEventListener('mousewheel', HANDLERS.mousewheel);

  HANDLERS.resize = function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    SVG.viewBox.baseVal.width = state.width;
    SVG.viewBox.baseVal.height = state.height;
  }

  window.addEventListener('resize', HANDLERS.resize);
  HANDLERS.resize();

  HANDLERS.keyevent = function keyevent(e) {
    state.shiftdown = e.shiftKey;
    SVG.style.cursor = e.shiftKey ? 'move' : '';
    if (e.which === 27) modal(false); // Escape key
  }

  window.addEventListener('keydown', HANDLERS.keyevent);
  window.addEventListener('keyup', HANDLERS.keyevent);

  function stopEventPropagation(e) { e.stopPropagation(); }
  MODAL.addEventListener('mouseup', stopEventPropagation);
  MODAL.addEventListener('mouseleave', stopEventPropagation);
  MODAL.addEventListener('mousemove', stopEventPropagation);
  MODAL.addEventListener('mousedown', stopEventPropagation);
  MODAL.addEventListener('touchstart', stopEventPropagation);
  MODAL.addEventListener('touchmove', stopEventPropagation);
  MODAL.addEventListener('touchcancel', stopEventPropagation);
  MODAL.addEventListener('touchleave', stopEventPropagation);
  MODAL.addEventListener('touchend', stopEventPropagation);
  MODAL.addEventListener('keydown', stopEventPropagation);
  MODAL.addEventListener('keyup', stopEventPropagation);
  forEach(document.querySelectorAll('#modal label, #modal input, #pen'), function (el) {
    el.addEventListener('click', stopEventPropagation);
    el.addEventListener('mousedown', stopEventPropagation);
    el.addEventListener('mousemove', stopEventPropagation);
    el.addEventListener('mouseup', stopEventPropagation);
    el.addEventListener('mouseleave', stopEventPropagation);
    el.addEventListener('touchstart', stopEventPropagation);
    el.addEventListener('touchmove', stopEventPropagation);
    el.addEventListener('touchcancel', stopEventPropagation);
    el.addEventListener('touchleave', stopEventPropagation);
    el.addEventListener('touchend', stopEventPropagation);
  });

  HANDLERS.change = function change(e) {
    API[e.target.name] = e.target.value;
  }

  MODAL.addEventListener('change', HANDLERS.change);

  HANDLERS.modalclick = function click(e) {
    if (e.target.tagName !== 'LABEL') modal(false);
  }

  MODAL.addEventListener('click', HANDLERS.modalclick);

  HANDLERS.penclick = function click(e) {
    e.preventDefault();
    e.stopPropagation();
    modal('all');
  }

  PEN.addEventListener('click', HANDLERS.penclick);
  PEN.addEventListener('touchstart', tap(HANDLERS.penclick, PEN));
  forEach(document.querySelectorAll('#modal-all + div > label'), function (el) {
    function modalclick(e) {
      e.preventDefault();
      e.stopPropagation();
      modal(el.dataset.modal);
    }

    el.addEventListener('click', modalclick);
    el.addEventListener('touchstart', tap(modalclick, el));
  });

  // Keyboard commands
  HANDLERS.keys = {
    117: 'undo',
    114: 'redo',
    99:  'color',
    111: 'opacity',
    115: 'size',
    108: 'layer',
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
    if (state.momentum) state.momentum = false;

    state.redos = [];
    state.path = new Path(state);
  }

  function handleDraw() {
    state.path.update(state);
    state.path.render();
  }

  function finishDraw() {
    state.path.update(state);
    state.path.simplify();
    state.path.render();
    state.paths.push(state.path);
    cleanupDraw();
  }

  function cleanupDraw() {
    state.path = null;
  }

  // Moving
  // ------

  function setupMove() {
    if (state.momentum) state.momentum = false;
    state.moveOrigin = state.pointer.clone();
    state.movePosition = new Point(state.x, state.y);
  }

  function handleMove() {
    var point = state.pointer.subtract(state.moveOrigin);
    translate(point.x, point.y);

    state._temp = state._temp || 0;
    state._temp++;
    if (state._temp === 10) {
      state.movePosition = new Point(state.x, state.y);
      state._temp = 0;
    }
  }

  function finishMove() {
    state.momentum = true;
    state.moveEnd = new Point(state.x, state.y);

    var first    = state.movePosition;
    var last     = state.moveEnd;
    var distance = last.subtract(first);
    var start    = Date.now();
    var duration = 500;

    window.requestAnimationFrame(function loop() {
      var time = Date.now() - start;
      if (!state.momentum || time > duration) return cleanupMove();

      var factor = easeOutQuint(time / duration);
      state.x = last.x + (distance.x * factor);
      state.y = last.y + (distance.y * factor);
      handleMove();
      state.x = state.moveEnd.x;
      state.y = state.moveEnd.y;

      window.requestAnimationFrame(loop);
    });
  }

  function cleanupMove() {
    state.momentum = false;
    state._temp = null;
  }

  // Modal
  // -----

  function modal(arg) {
    if (arg === false) {
      // Close modal
      MODAL.style.display = 'none';
      forEach(MODAL.querySelectorAll('input[type="checkbox"]'), function (el) {
        el.checked = false;
      });
    } else {
      // Open modal
      modal(false); // First close any open modals
      MODAL.style.display = 'block';
      document.getElementById('modal-' + arg).checked = true;
    }
  }

  // API
  // ---

  API.undo = function() {
    var path = state.paths.pop();
    if (!path) return;
    path.layer.removeChild(path.el);
    state.redos.push(path);
  }

  API.redo = function() {
    var path = state.redos.pop();
    if (!path) return;
    path.layer.insertBefore(path.el, null);
    state.paths.push(path);
  }

  Object.defineProperties(API, {

    layer: {
      get: function () { return +state.layer.id.split('-')[1]; },
      set: function (num) { state.layer = document.getElementById('layer-' + num); }
    },

    color: {
      get: function () { return state.color; },
      set: function (color) { state.color = color; }
    },

    size: {
      get: function () { return state.size; },
      set: function (size) { state.size = size; }
    },

    opacity: {
      get: function () { return state.opacity; },
      set: function (opacity) { state.opacity = opacity; }
    }

  });

  // Commands
  // --------

  COMMANDS = {

    undo: API.undo,
    redo: API.redo,

    color:   function () { modal('color');   },
    opacity: function () { modal('opacity'); },
    size:    function () { modal('size');    },
    layer:   function () { modal('layer');   },

    play: function () {
      // Hide all
      state.paths.forEach(function (path, i) {
        path.index = i;
        if (!path.length) path.length = Math.ceil(path.el.getTotalLength());
        path.el.setAttribute('stroke-dasharray', path.length + 'px');
        path.el.setAttribute('stroke-dashoffset', path.length + 'px');
        path._dashoffset = path.length;
      });

      // Animate in sequence
      state.paths[0].play();
    }

  }

})();
