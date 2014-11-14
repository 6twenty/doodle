(function () {

  var XMLNS = 'http://www.w3.org/2000/svg';
  var SVG = document.getElementById('svg');

  var pointer = { x: null, y: null };

  var currentPath;

  var _mouseDown = false;
  var _shiftDown = false;

  window.addEventListener('mousedown', function (e) {
    _mouseDown = true;
    _shiftDown = e.shiftKey;
  });

  [ 'mouseup', 'mouseleave' ].forEach(function (eventType) {
    window.addEventListener(eventType, function (e) {
      _mouseDown = false;
      _shiftDown = e.shiftKey;
    });
  });

  window.addEventListener('mousemove', function (e) {
    pointer.x = e.pageX;
    pointer.y = e.pageY;
  });

  function mode() {
    if (_mouseDown && _shiftDown) return 'drag';
    if (_mouseDown && !_shiftDown) return 'draw';
  }

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

  function handleDrag() {
    console.log('panning', pointer);
  }

  function handleDraw() {
    if (!currentPath) newPath();

    currentPath.d += ' L' + (pointer.x + ' ' + pointer.y);
    currentPath.el.setAttribute('d', currentPath.d);
  }

  function handleDefault() {
    currentPath = null;
  }

  function newPath() {
    var element = document.createElementNS(XMLNS, 'path');

    currentPath = {
      d: 'M' + (pointer.x + ' ' + pointer.y),
      el: element
    }

    element.setAttribute('d', currentPath.d);
    SVG.insertBefore(element, null);
  }

})();
