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
    if (!qd.paths._array.length) { return false; };

    var path       = qd.paths.pop(),
        serialized = qd.server.serializePath(path);

    path._raphael.remove();
    qd.undos.push(serialized);
    qd.server.patch(); // triggers _delete
  }

  // pops the last redo path and appends it back into the main collection
  // resets the opacity back to it's former value
  qd.redo = function() {
    if (!qd.undos._array.length) { return false; };

    var serialized = qd.undos.pop(),
        path       = qd.server.deserializePath(serialized);

    qd.paths.push(path);
    qd.server.patch(path);
  }

  // =========
  // Normalize
  // =========

  // return an object with x and y attributes of the event
  qd.normalize.coordinates = function(e) {
    if (_.isObject(e.originalEvent) && e.originalEvent.targetTouches) {
      return {
        x: e.originalEvent.targetTouches[0].pageX,
        y: e.originalEvent.targetTouches[0].pageY
      }
    } else {
      return { x: e.pageX, y: e.pageY };
    }
  }

})();