// =======
// Options
// =======
//
// Provides restrictions against the corresponding
// objects to limit the values that can be set.

// globals
qd.options      = {};
qd.options.mode = [ 'draw', 'drag' ];
qd.options.zoom = [ 0, 10 ];

// pen
qd.options.pen            = {};
qd.options.pen.mode       = [ 'draw', 'erase' ];
qd.options.pen.size       = [ 0, 100 ];
qd.options.pen.eraserSize = [ 0, 100 ];
qd.options.pen.opacity    = [ 0, 1 ];

// ==============
// Getter/Setters
// ==============
//
// Functions to manage the state of the app.

// app mode (drawing or panning)
qd.mode = function(newVal) {
  if (newVal) { qd.path._attrsChanged = true; }
  if (newVal && _.include(qd.options.mode, newVal)) {
    this._mode = newVal;
    qd.$body.removeClass('crosshair move').addClass(this._mode == 'draw' ? 'crosshair' : 'move');
    return this._mode;
  } else {
    return this._mode;
  }
}

qd.pen = {};

// pen mode (drawing or erasing)
qd.pen.mode = function(newVal) {
  if (newVal) { qd.path._attrsChanged = true; }
  if (newVal && _.include(qd.options.pen.mode, newVal)) {
    this._mode = newVal;
    return this._mode;
  } else {
    return this._mode;
  }
}

// pen color (accepts any value)
qd.pen.color = function(newVal) {
  if (newVal) { qd.path._attrsChanged = true; }
  if (newVal) {
    this._color = newVal;
    return this._color;
  } else {
    return this._color;
  }
}

// pen/eraser size, & opacity (requires valid range)
_.each([ 'size', 'eraserSize', 'opacity' ], function(key) {
  qd.pen[key] = function(newVal) {
    if (newVal) { qd.path._attrsChanged = true; }
    var range = qd.options.pen[key];
    if (_.isFinite(newVal) && newVal >= range[0] && newVal <= range[1]) {
      this['_' + key] = +newVal.toFixed(2);
      return this['_' + key];
    } else {
      return this['_' + key];
    }
  }
});

// zoom level (requires valid range)
qd.zoom = function(newVal) {
  var range = qd.options.zoom;
  if (_.isFinite(newVal) && newVal >= range[0] && newVal <= range[1]) {
    this._zoom = +newVal.toFixed(2);
    this._zoomTo(this._zoom); // deferred, see section "UI & Drawing"
    return this._zoom;
  } else {
    return this._zoom;
  }
}

// ========
// Defaults
// ========

// globals
qd._mode = 'draw';

// pen
qd.pen._mode       = 'draw';
qd.pen._color      = 'black';
qd.pen._size       = 10;
qd.pen._eraserSize = 10;
qd.pen._opacity    = 1;

// ============
// UI & Drawing
// ============

qd.path = {};

// path attributes are cached until changed
qd.path._attrsChanged = true;
qd.path.attrs = function() {
  if (qd.path._attrsChanged) {
    qd.path._attrsCache = {
      'stroke'          : qd.pen._mode == 'draw' ? qd.pen._color : 'white',
      'opacity'         : qd.pen._mode == 'draw' ? qd.pen._opacity : 1,
      'stroke-width'    : qd.pen._mode == 'draw' ? qd.pen._size : qd.pen._eraserSize,
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

  path.remove();
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

// private, zooms to the given zoom level
qd._zoomTo = function(zoom) {
  // the anchor point for zooming should be the center of the viewport,
  // which may be almost any point on the canvas
  // qd.canvas.setViewBox(0, 0, 3200, 3200, false);
  consoe.log('Zooming to ' + zoom);
}

// ============
// Events: Draw
// ============

qd.events      = {};
qd.events.draw = {};

// handles the first mousedown event to start a drawing path
qd.events.draw.start = function(coords) {
  if (!qd._drawing) {
    qd._drawing = true;
    // initialize a paper path (not rendered)
    qd._paperPath = new paper.Path();
    qd._paperPath.moveTo(new paper.Point(coords.x, coords.y));
    qd._paperPath.lineTo(new paper.Point(coords.x, coords.y));
    // initialize a raphael path (rendered)
    qd._raphaelPath = 'M' + [ coords.x, coords.y ].join(',') + 'L';
    qd._raphaelPath += [ coords.x, coords.y ].join(',');
    qd._raphaelPath = qd.canvas.path(qd._raphaelPath).attr(qd.path.attrs());
  }
}

// throttled
// handles the mousemove events to extend the current drawing path
qd.events.draw.move = _.throttle(function(coords) {
  if (qd._drawing) {
    // extend the paper path
    qd._paperPath.lineTo(new paper.Point(coords.x, coords.y));
    // extend the raphael path
    qd._raphaelPath.attr('path', qd._raphaelPath.attr('path') + ' ' + [ coords.x, coords.y ].join(','));
    // testing
    // qd._customPath.lineTo(new Point(coords.x, coords.y));

    // remember these coordinates
    // this is to assist drag.stop() as touchend
    // doesn't return any coordinates
    qd._coordsCache = coords;
  }
}, 15);

// handles the mouseup & mouseleave events to complete the drawing path
qd.events.draw.stop = function(coords) {
  if (qd._drawing) {
    // touchend events return 0, 0 so use the previous touchmove coordinates
    if (!coords.x && !coords.y) {
      coords = qd._coordsCache;
      delete qd._coordsCache;
    }

    // extend the paper path
    qd._paperPath.lineTo(new paper.Point(coords.x, coords.y));
    // extend the raphael path
    qd._raphaelPath.attr('path', qd._raphaelPath.attr('path') + ' ' + [ coords.x, coords.y ].join(','));
    // testing
    // qd._customPath.lineTo(new Point(coords.x, coords.y));

    // stop drawing
    qd._drawing = false;

    // clear the current path references
    var rPath = qd._raphaelPath, pPath = qd._paperPath;
    delete qd._paperPath;
    delete qd._raphaelPath;
    // delete qd._customPath;

    // perform line smoothing if there are enough points
    // when erasing, only minimal line smoothing is applied
    var newPath;
    if (pPath.segments.length > 3) {
      pPath.simplify(qd.pen._mode == 'draw' ? (qd.pen._size * 2.5) : 1);

      // regenerate the rendered path using the smoothed paper path
      var previousSegment; newPath = 'M';
      _.each(pPath.segments, function(segment, i) {
        var x1 = previousSegment ? (previousSegment.point.x + previousSegment.handleOut.x) : null,
            y1 = previousSegment ? (previousSegment.point.y + previousSegment.handleOut.y) : null,
            x2 = previousSegment ? (segment.point.x + segment.handleIn.x) : null,
            y2 = previousSegment ? (segment.point.y + segment.handleIn.y) : null,
            x  = segment.point.x,
            y  = segment.point.y;

        if (i === 0) {
          // first point defines the starting point
          newPath += [ x, y ].join(' ') + 'C';
        } else {
          // subsequent points are joined by a curve
          newPath += [ x1, y1, x2, y2, x, y ].join(' ') + ' ';
        }

        // expose this segment to the next iteration
        previousSegment = segment;
      });

      // remove the current rendered path
      rPath.remove();

      // render the new smoothed path
      newPath = qd.canvas.path(newPath).attr(qd.path.attrs());
    }

    // add this path to the collection
    qd.paths.push(newPath || rPath);

    // clear the redo log
    qd.undos = [];

    // send the new path to the server
    qd.server.patch(newPath || rPath);
  }
}

// ============
// Events: Drag
// ============

qd.events.drag = {};

// handles the first mousedown event to start dragging
qd.events.drag.start = function(coords) {
  if (!qd.events.drag._origin) {
    qd.events.drag._origin = coords;
    qd.events.drag._maxOffset = {
      x: $win.width() - 3200,
      y: $win.height() - 3200
    };
  }
}

// handles the mousemove events to reposition the canvas
qd.events.drag.move = _.throttle(function(coords) {
  if (qd.events.drag._origin) {
    var origin   = qd.events.drag._origin,
        distance = { x: coords.x - origin.x, y: coords.y - origin.y },
        offset   = { x: -(qd.offset.x - distance.x), y: -(qd.offset.y - distance.y) };

    // remember these coordinates
    // this is to assist drag.stop() as touchend
    // doesn't return any coordinates
    qd._coordsCache = coords;

    // prevent dragging beyond the left and top of the canvas
    if (offset.x > 0) { offset.x = 0 };
    if (offset.y > 0) { offset.y = 0 };

    // prevent dragging beyond the right and bottom of the canvas
    if (offset.x < qd.events.drag._maxOffset.x) { offset.x = qd.events.drag._maxOffset.x };
    if (offset.y < qd.events.drag._maxOffset.y) { offset.y = qd.events.drag._maxOffset.y };

    // position the canvas in the viewport
    qd.$canvas.css({ left: offset.x, top: offset.y });
  }
}, 15);

// handles the mouseup/mouseleave/touchend events to stop dragging
qd.events.drag.stop = function(coords) {
  if (qd.events.drag._origin) {
    // touchend events return 0, 0 so use the previous touchmove coordinates
    if (!coords.x && !coords.y) {
      coords = qd._coordsCache;
      delete qd._coordsCache;
    }

    var origin   = qd.events.drag._origin,
        distance = { x: coords.x - origin.x, y: coords.y - origin.y },
        offset   = { x: qd.offset.x - distance.x, y:qd.offset.y - distance.y };

    // prevent setting the offset beyong the left and top of the canvas
    if (offset.x < 0) { offset.x = 0 };
    if (offset.y < 0) { offset.y = 0 };

    // prevent setting the offset beyond the right and bottom of the canvas
    if (offset.x > Math.abs(qd.events.drag._maxOffset.x)) { offset.x = Math.abs(qd.events.drag._maxOffset.x) };
    if (offset.y > Math.abs(qd.events.drag._maxOffset.y)) { offset.y = Math.abs(qd.events.drag._maxOffset.y) };

    qd.offset = offset;
    delete qd.events.drag._origin;
  }
}

// ======
// Server
// ======

qd.server = {};

// create a simple object from a path which stores
// the path string and pen attributes ready for
// storage as JSON on the server
qd.server.serializePath = function(path) {
  return {
    string: path.attr('path') + '',
    pen: {
      size: path.attr('stroke-width'),
      color: path.attr('stroke'),
      opacity: path.attr('opacity')
    }
  }
}

// reinstate a path which has been serialized using
// the above function
// Note: this action also renders the path to the UI
qd.server.deserializePath = function(object) {
  return qd.canvas.path(object.string).attr({
    'stroke'          : object.pen.color,
    'opacity'         : object.pen.opacity,
    'stroke-width'    : object.pen.size,
    'stroke-linecap'  : 'round',
    'stroke-linejoin' : 'round'
  });
}

// make a server request which adds or removes the latest path
qd.server.patch = function(path) {
  var data = { _method: 'patch' };

  if (path) {
    data.path = JSON.stringify(qd.server.serializePath(path));
  } else {
    data._delete = '1';
  }

  $.ajax({
    type     : 'POST',
    url      : '/' + qd.id,
    data     : data,
    dataType : 'json'
  });
}

// ==========
// Dimensions
// ==========

qd.reflow = function() {

  // recalculate the current window size
  var w = $win.width(),
      h = $win.height();

  // calculate the offset
  qd.offset = {
    x: (3200 - w) / 2,
    y: (3200 - h) / 2
  };

  // set the #window element's size to match the main window
  qd.$window.width(w).height(h);

  // center the viewport
  qd.$canvas.css({ left: -qd.offset.x, top: -qd.offset.y });

}

// wait for the initial json data to be ready
$doc.on('qd.ready', function() {
  // wait for the dom to be ready
  $(function() {

    // ===
    // DOM
    // ===

    qd.$body   = $('body');
    qd.$window = $('#window');
    qd.$canvas = $('#canvas');

    // set up the correct dimensions
    qd.reflow();

    // set the correct cursor
    qd.mode(qd._mode);

    // =======
    // Raphael
    // =======

    // qd.canvas = Raphael('canvas', 3200, 3200).setViewBox(0, 0, 3200, 3200, false);
    qd.canvas = Raphael('canvas', 3200, 3200);

    // store the collection of paths
    qd.paths = qd.canvas.set();

    // store the collection of undos
    qd.undos = qd.canvas.set();

    // draw a "canvas"
    qd.canvas.rect(30, 30, 3140, 3140).attr({
      'fill'        : 'white',
      'stroke'      : '#ccc',
      'stroke-width': 1
    });

    // ========
    // Paper.js
    // ========

    paper.view    = new paper.View();
    paper.project = new paper.Project();

    // =======
    // Initial
    // =======

    // gets the initial drawing paths and renders them to the UI
    if (qd.initial) {
      _.each(qd.initial, function(serialized) {
        var path = qd.server.deserializePath(serialized);
        qd.paths.push(path);
      });
    }

    // ======
    // jQuery
    // ======

    // handles resetting the viewport when the window size changes
    $win.resize(_.throttle(function() {
      qd.reflow();
    }, 15));

    // handles resetting the viewport when the orientation is changed
    $doc.on('orientationchange', qd.reflow);

    // return an object with x and y attributes of the event
    function normalizeEventCoordinates(e) {
      return { x: e.pageX, y: e.pageY };
    }

    // return the corrdinates taking into account the
    // current canvas offet (for correct render location)
    function coordinatesWithOffset(coords) {
      return {
        x: coords.x + qd.offset.x,
        y: coords.y + qd.offset.y
      }
    }

    // combines the above functions
    function normalizeEventCoordinatesWithOffset(e) {
      return coordinatesWithOffset(normalizeEventCoordinates(e));
    }

    // as normalizeEventCoordinates(), but for touch events
    function normalizeTouchEventCoordinates(e, i) {
      return {
        x: e.originalEvent.targetTouches[i || 0].pageX,
        y: e.originalEvent.targetTouches[i || 0].pageY
      }      
    }

    // as normalizeEventCoordinatesWithOffset(), but for touch events
    function normalizeTouchEventCoordinatesWithOffset(e, i) {
      return coordinatesWithOffset(normalizeTouchEventCoordinates(e, i));
    }

    // ===============
    // Handlers: mouse
    // ===============

    qd.$window.on('mousedown', function(e) {
      e.preventDefault();

      if (qd._mode == 'draw') {
        qd.events.draw.start(normalizeEventCoordinatesWithOffset(e));
      } else {
        qd.events.drag.start(normalizeEventCoordinates(e));
      }
    }).on('mousemove', function(e) {
      e.preventDefault();

      if (qd._mode == 'draw') {
        qd.events.draw.move(normalizeEventCoordinatesWithOffset(e));
      } else {
        qd.events.drag.move(normalizeEventCoordinates(e));
      }
    }).on('mouseup mouseleave', function(e) {
      e.preventDefault();

      if (qd._mode == 'draw') {
        qd.events.draw.stop(normalizeEventCoordinatesWithOffset(e));
      } else {
        qd.events.drag.stop(normalizeEventCoordinates(e));
      }
    });

    // ===============
    // Handlers: touch
    // ===============

    qd.$window.on('touchstart', function(e) {
      e.preventDefault();

      // assume the mode, but do nothing (yet)
      // we may receive a 2nd touchstart indicating a drag; only
      // trigger a change if a touchmove event hasn't yet fired
      if (e.originalEvent.targetTouches.length === 1) {
        qd.mode('draw');
        // if we do end up drawing we'll discard any other touches
        qd._trackTouch = e.originalEvent.targetTouches[0].identifier;
      } else if (!qd._tracking) {
        delete qd._trackTouch;
        qd.mode('drag');
      }
    }).on('touchmove', function(e) {
      e.preventDefault();

      // handle the event differently depending on
      // whether we're drawing or dragging
      if (qd._mode == 'draw') {
        // flag to indicate we're tracking a single touch
        qd._tracking = true;
        if (e.originalEvent.targetTouches[0].identifier == qd._trackTouch) {
          if (!qd._drawing) { qd.events.draw.start(normalizeTouchEventCoordinatesWithOffset(e)); }
          qd.events.draw.move(normalizeTouchEventCoordinatesWithOffset(e));
        }
      } else {
        // currently, factor in the coordinates of the first touch only
        if (!qd.events.drag._origin) { qd.events.drag.start(normalizeTouchEventCoordinates(e)); }
        qd.events.drag.move(normalizeTouchEventCoordinates(e));
      }
    }).on('touchend', function(e) {
      e.preventDefault();

      if (qd._mode == 'draw') {
        qd.events.draw.stop({ x: 0, y: 0 });
      } else {
        qd.events.drag.stop({ x: 0, y: 0 });
      }

      delete qd._trackTouch;
      delete qd._tracking;
    });

  });
});
