// ==========
// utility.js
// ==========
// 
// Utility functions to support maintaining the app's state.

;(function() {

  // expire the pen's attributes cache and update the UI pen
  qd.pen.update = function() {
    qd.path._attrsChanged = true;
    qd.pen.uiPen.attr({
      'r'       : (qd.pen._mode == 'draw' ? qd.pen._size : qd.pen._eraserSize) / 2,
      'fill'    : qd.pen._mode == 'draw' ? qd.pen._color : 'white',
      'opacity' : qd.pen._mode == 'draw' ? qd.pen._opacity : 1
    });
  }

  // path attributes are cached until changed
  qd.path._attrsChanged = true;
  qd.path.attrs = function() {
    if (qd.path._attrsChanged) {
      qd.path._attrsCache = {
        'stroke'          : qd.pen._mode == 'draw' ? qd.pen._color : 'white',
        'opacity'         : qd.pen._mode == 'draw' ? qd.pen._opacity : 1,
        'stroke-width'    : (qd.pen._mode == 'draw' ? qd.pen._size : qd.pen._eraserSize) * qd._zoom,
        'stroke-linecap'  : 'round',
        'stroke-linejoin' : 'round'
      }

      qd.path._attrsChanged = false;
    }

    return qd.path._attrsCache;
  }

  // pops the last path and stores it in a separate collection
  // hides it from view by setting the opacity to 0
  qd.undo = function() {
    if (!qd.paths.length) { return false; };

    var path       = qd.paths.pop(),
        serialized = qd.server.serializePath(path);

    path._raphael.remove();
    qd.undos.push(serialized);
    qd.server.patch(); // triggers _delete
  }

  // pops the last redo path and appends it back into the main collection
  // resets the opacity back to it's former value
  qd.redo = function() {
    if (!qd.undos.length) { return false; };

    var serialized = qd.undos.pop(),
        path       = qd.server.deserializePath(serialized);

    qd.paths.push(path);
    qd.server.patch(path);
  }

  // recalculate the current offset and (optionally)
  // reposition the viewport in the center of the canvas
  qd.reflow = function(center) {
    // recalculate the current window size
    var w = $win.width(),
        h = $win.height();

    // calculate the offset
    qd.offset = {
      x: (qd._size - w) / 2,
      y: (qd._size - h) / 2
    };

    // set the #window element's size to match the main window
    qd.$window.width(w).height(h);

    // center the viewport
    if (center) { qd.$canvas.css({ left: -qd.offset.x, top: -qd.offset.y }); }
  }

  // ================
  // Normalize events
  // ================

  // return an object with x and y attributes of the event
  qd.normalize.eventCoordinates = function(e) {
    return { x: e.pageX, y: e.pageY };
  }

  // return the corrdinates taking into account the
  // current canvas offet (for correct render location)
  qd.normalize.coordinatesWithOffset = function(coords) {
    return {
      x: coords.x + qd.offset.x,
      y: coords.y + qd.offset.y
    }
  }

  // combines the above functions
  qd.normalize.eventCoordinatesWithOffset = function(e) {
    return qd.normalize.coordinatesWithOffset(qd.normalize.eventCoordinates(e));
  }

  // as normalizeEventCoordinates(), but for touch events
  qd.normalize.touchEventCoordinates = function(e, i) {
    return {
      x: e.originalEvent.targetTouches[i || 0].pageX,
      y: e.originalEvent.targetTouches[i || 0].pageY
    }      
  }

  // as normalizeEventCoordinatesWithOffset(), but for touch events
  qd.normalize.touchEventCoordinatesWithOffset = function(e, i) {
    return qd.normalize.coordinatesWithOffset(qd.normalize.touchEventCoordinates(e, i));
  }

})();