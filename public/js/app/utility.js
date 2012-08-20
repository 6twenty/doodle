// ==========
// utility.js
// ==========
// 
// Utility functions to support maintaining the app's state.

;(function() {

  // Custom array: initialize (internal reference to a raphael set)
  Array.prototype.initialize = function() {
    var set = this.set = qd.canvas.set();
    _.each(this, function(path) {
      set.push(path._raphael);
    });
  }

  // Custom array: scale
  Array.prototype.scale = function(factor) {
    if (!this.set) { this.initialize(); }
    var set = this.set;
    qd._transform.s = 'S' + [ factor, factor, qd.center.x, qd.center.y ].join(',');
    set.transform(qd._transform.toString());
    _.each(set, function(path) {
      var n = +path.attr('stroke-width');
      path.attr('stroke-width', n * factor);
    });
  }

  // // Custom array: add (push)
  Array.prototype.add = function(path) {
    if (!this.set) { this.initialize(); }
    this.set.push(path._raphael);
    return Array.prototype.push.apply(this, arguments);
  };

  // Custom array: remove (pop)
  Array.prototype.remove = function(path) {
    if (!this.set) { this.initialize(); }
    this.set.pop(path._raphael);
    return Array.prototype.pop.apply(this, arguments);
  };

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

    var path       = qd.paths.remove(),
        serialized = qd.server.serializePath(path);

    path._raphael.remove();
    qd.undos.add(serialized);
    qd.server.patch(); // triggers _delete
  }

  // pops the last redo path and appends it back into the main collection
  // resets the opacity back to it's former value
  qd.redo = function() {
    if (!qd.undos.length) { return false; };

    var serialized = qd.undos.remove(),
        path       = qd.server.deserializePath(serialized);

    qd.paths.add(path);
    qd.server.patch(path);
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