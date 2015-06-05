(function () {

  var XMLNS, SVG;
  var _pool,
      _pointer,
      _path,
      _detached,
      _mouseDown,
      _shiftDown,
      _size = 50,
      _colour = '#000',
      _d;

  // Constants
  // ---------

  XMLNS = 'http://www.w3.org/2000/svg';
  SVG   = document.getElementById('svg');
  API   = {};

  // Globals
  // -------

  _pool      = [];
  _pointer   = new Point();
  _mouseDown = false;
  _shiftDown = false;

  // Events
  // ------

  window.addEventListener('mousedown', function (e) {
    _mouseDown = true;
    _shiftDown = e.shiftKey;
    _pointer.x = e.pageX;
    _pointer.y = e.pageY;
  });

  [ 'mouseup', 'mouseleave' ].forEach(function (eventType) {
    window.addEventListener(eventType, function (e) {
      _mouseDown = false;
      _shiftDown = e.shiftKey;
    });
  });

  window.addEventListener('mousemove', function (e) {
    if (_mouseDown) {
      _pointer.x = e.pageX;
      _pointer.y = e.pageY;
    }
  });

  // Main loop
  // ---------

  requestAnimationFrame(function loop() {
    switch (mode()) {
      case 'drag':
        handleDrag();
        break;
      case 'draw':
        handleDraw();
        break;
      default:
        handleDefault();
    }

    requestAnimationFrame(loop);
  });

  // Functions
  // ---------

  // Retrieves a point from the pool or instantiates a new one
  function getPoint() {
    if (_pool.length > 0) {
      return _pool.pop();
    } else {
      return new Point();
    }
  }

  // Puts a set of points back in the pool
  function releasePoints(points) {
    for (var i=points.length-1; i >= 0; i--) {
      _pool.push(points[i]);
    };
  }

  function mode() {
    if (_mouseDown && _shiftDown) return 'drag';
    if (_mouseDown && !_shiftDown) return 'draw';
  }

  function handleDefault() {
    if (_path) _path = null;
    _els = null;
  }

  function handleDrag() {

  }

  function handleDraw() {
    if (!_path) setupPath();

    if (detectDistance() > 0) {
      var point = getPoint();
      point.x = _pointer.x;
      point.y = _pointer.y;
      _path.points.push(point);
    }

    // Render/re-render the path
    drawPath();
  }

  function setupPath() {
    _path = {};
    _path.simplePath = new Path();
    _path.cache = [];
    _path.points = [ _pointer ];
    _path.counter = 1;
    _path.smoothPoints = [];
    _path.el = document.createElementNS(XMLNS, 'path');
    _path.el.setAttribute('stroke', _colour);
    _path.el.setAttribute('stroke-width', _size);
    _path.detached = true;
  }

  function attachPath() {
    _path.detached = false;
    SVG.insertBefore(_path.el, null);
  }

  function detectDistance() {
    var point = _path.points[_path.points.length-1];
    return point.getDistance(_pointer);
  }

  function drawPath() {
    if (_els) {
      _els.forEach(function (a) { SVG.removeChild(a); });
      _els = [];
    }
    if (_path.points.length === 1) {
      _path.cache = _cache.concat(_path.points);
      _path.points = [];
      _path.simplePath.setSegments(_path.cache);
      _path.simplePath.simplify(10);
      _path.smoothPoints = _path.simplePath.getSegments();
      _path.d = compileSmoothPathString();
    } else {
      _path.d = compilePathString();
    }
    _path.el.setAttribute('d', _path.d);
    if (_path.detached) attachPath();
  }

  function compileSmoothPathString() {
    var segments = _path.smoothPoints;
    var previousSegment = segments[0];
    var startPoint = segments[0].point;
    var pathString = 'M' + startPoint.x + ' ' + startPoint.y;

    renderRectAt(startPoint.x, startPoint.y);

    for (var i=1, l=segments.length; i<l; i++) {
      var segment = segments[i];
      var x = segment.point.x;
      var y = segment.point.y;
      var x1 = previousSegment.point.x + previousSegment.handleOut.x;
      var y1 = previousSegment.point.y + previousSegment.handleOut.y;
      var x2 = segment.point.x + segment.handleIn.x;
      var y2 = segment.point.y + segment.handleIn.y;

      renderRectAt(x, y);
      renderRectAt(x1, y1);
      renderRectAt(x2, y2);
      renderLine(x2, y2, segment.point.x + segment.handleOut.x, segment.point.y + segment.handleOut.y);

      pathString += ('C' + [ x1, y1, x2, y2, x, y ].join(' '));
      previousSegment = segment;
    }

    if (segments.length < 2) {
      pathString += ('L' + startPoint.x + ' ' + startPoint.y);
    }

    return pathString;
  }

  function renderRectAt(x, y) {
    window._els = window._els || [];
    var rect = document.createElementNS(XMLNS, 'rect');
    rect.setAttribute('x', x-2);
    rect.setAttribute('y', y-2);
    rect.setAttribute('width', 4);
    rect.setAttribute('height', 4);
    rect.setAttribute('style', 'fill:green;stroke:none;');
    _els.push(rect);
    SVG.insertBefore(rect, null);
  }

  function renderLine(x1, y1, x2, y2) {
    window._els = window._els || [];
    var line = document.createElementNS(XMLNS, 'path');
    line.setAttribute('d', 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2);
    line.setAttribute('style', 'stroke:green;stroke-width:1px;fill:none;');
    _els.push(line);
    SVG.insertBefore(line, null);
  }

  // API
  // ---

  API.colour = function (colour) {
    if (!colour) return _colour;
    return _colour = colour;
  }

  API.size = function (size) {
    if (!size) return _size;
    return _size = size;
  }

  window.qd = API;

})();
