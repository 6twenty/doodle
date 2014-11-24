(function () {

  var XMLNS, SVG;
  var _pointer,
      _currentPath,
      _mouseDown,
      _shiftDown,
      _size = 5,
      _colour = '#000';

  // Constants
  // ---------

  XMLNS = 'http://www.w3.org/2000/svg';
  SVG   = document.getElementById('svg');
  API   = {};

  // Globals
  // -------

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
      _currentPath = null;
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

  function mode() {
    if (_mouseDown && _shiftDown) return 'drag';
    if (_mouseDown && !_shiftDown) return 'draw';
  }

  function handleDrag() {
    console.log('panning', _pointer);
  }

  function handleDraw() {
    if (!_currentPath) setupPath();

    // Append current point to the path; but only if
    // the current pointer is sufficient distance from previous
    var distance = detectDistance();
    if (distance > 0) {
      _currentPath.add(_pointer.clone());
      _currentPath.raw.push([_pointer.x, _pointer.y]);
    }

    // Render/re-render the path
    drawPath();
  }

  function handleDefault() {
    if (_currentPath) _currentPath = null;
  }

  function setupPath() {
    _currentPath = new Path();
    _currentPath.detached = true;
    _currentPath.add(_pointer.clone());
    _currentPath.raw = [[ _pointer.x, _pointer.y ]];
  }

  function drawPath() {
    if (_currentPath.detached) attachPath();
    var simplePath = new Path();
    simplePath.setSegments(_currentPath.raw);
    simplePath.simplify(10);
    var d = compilePathString(simplePath.segments);
    _currentPath.el.setAttribute('d', d);
  }

  function compilePathString(segments) {
    // build a new SVG string for the path
    var previousSegment = segments[0];
    var startPoint = segments[0].point;
    var pathString = 'M' + startPoint.x + ' ' + startPoint.y;
    segments.slice(1, segments.length).forEach(function(segment) {
      var x = segment.point.x;
      var y = segment.point.y;
      var x1 = previousSegment.point.x + previousSegment.handleOut.x;
      var y1 = previousSegment.point.y + previousSegment.handleOut.y;
      var x2 = segment.point.x + segment.handleIn.x;
      var y2 = segment.point.y + segment.handleIn.y;

      pathString += ('C' + [ x1, y1, x2, y2, x, y ].join(' '));
      previousSegment = segment;
    });

    if (segments.length < 2) {
      pathString += ('L' + startPoint.x + ' ' + startPoint.y);
    }

    return pathString;
  }

  // TODO: batch the DOM attachment + setAttribute together
  function attachPath() {
    _currentPath.detached = false;
    _currentPath.el = document.createElementNS(XMLNS, 'path');
    _currentPath.el.setAttribute('stroke', _colour);
    _currentPath.el.setAttribute('stroke-width', _size);
    SVG.insertBefore(_currentPath.el, null);
  }

  function detectDistance() {
    var point = _currentPath.segments[_currentPath.segments.length-1].point;
    return point.getDistance(_pointer);
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
