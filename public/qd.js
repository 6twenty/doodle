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
qd.options.pen.size       = [ 1, 100 ];
qd.options.pen.eraserSize = [ 1, 100 ];
qd.options.pen.opacity    = [ 0.01, 1 ];

// ==============
// Getter/Setters
// ==============
//
// Functions to manage the state of the app.

// app mode (drawing or panning)
qd.mode = function(newVal) {
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
  if (newVal && _.include(qd.options.pen.mode, newVal)) {
    this._mode = newVal;
    qd.pen.update();
    return this._mode;
  } else {
    return this._mode;
  }
}

// pen color (accepts any value)
qd.pen.color = function(newVal) {
  if (newVal) {
    this._color = newVal;
    qd.pen.update();
    return this._color;
  } else {
    return this._color;
  }
}

// pen/eraser size, & opacity (requires valid range)
_.each([ 'size', 'eraserSize', 'opacity' ], function(key) {
  qd.pen[key] = function(newVal) {
    var range = qd.options.pen[key];
    if (_.isFinite(newVal) && newVal >= range[0] && newVal <= range[1]) {
      this['_' + key] = +newVal.toFixed(2);
      qd.pen.update();
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
    this._zoom          = +newVal.toFixed(2);
    this._previousSize  = this._size;
    this._size          = this._originalSize * this._zoom;
    this._margin        = this._originalMargin * this._zoom;
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
qd._mode            = 'draw';
qd._colors          = [
  '#46648e', // blue (strong)
  '#8bbbff', // blue (pale)
  '#89ad48', // green (strong)
  '#d1d642', // green (pale)
  '#8c5ba7', // purple (strong)
  '#ca76bf', // purple (pale)
  '#d7503c', // red (strong)
  '#d17060', // red (pale)
  '#f49f14', // yellow (strong)
  '#fae014'  // yellow (pale)
]

// scaling
qd._zoom            = 1;
qd._originalSize    = 3200;
qd._size            = qd._originalSize;
qd._previousSize    = qd._originalSize;
qd._originalMargin  = 30;
qd._margin          = qd._originalMargin;

// pen
qd.pen._mode        = 'draw';
qd.pen._color       = 'black';
qd.pen._size        = 10;
qd.pen._eraserSize  = 10;
qd.pen._opacity     = 1;

// ============
// UI & Drawing
// ============

qd.pen.update = function() {
  qd.path._attrsChanged = true;
  qd.pen.ui.attr({
    'r'       : (qd.pen._mode == 'draw' ? qd.pen._size : qd.pen._eraserSize) / 2,
    'fill'    : qd.pen._mode == 'draw' ? qd.pen._color : 'white',
    'opacity' : qd.pen._mode == 'draw' ? qd.pen._opacity : 1
  });
}

qd.path = {};

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

// private(ish), zooms to the given zoom level
qd._zoomTo = function(zoom) {
  // scale the canvas
  qd.canvas.setSize(qd._size, qd._size);

  // scale the margin
  qd.paper.attr({
    'x'      : qd._margin,
    'y'      : qd._margin,
    'width'  : qd._size - (qd._margin * 2),
    'height' : qd._size - (qd._margin * 2)
  });

  // reposition the paths
  qd.paths.transform('T' + ((qd._size - qd._previousSize) / 2) + ',' + ((qd._size - qd._previousSize) / 2) + 's' + [ zoom, zoom, (qd._previousSize / 2), (qd._previousSize / 2) ].join(','));

  // adjust the path strokes
  _.each(qd.paths, function(path) {
    if (!path._originalStrokeWidth) {
      path._originalStrokeWidth = +path.attr('stroke-width');
    }

    path.attr({
      'stroke-width': path._originalStrokeWidth * zoom
    });
  });

  // adjust
  qd.reflow();





  // var margin = (qd._margin * zoom), paperSize = qd._size - (margin * 2);
  // qd.paper.attr({
  //   'x'      : margin,
  //   'y'      : margin,
  //   'width'  : paperSize,
  //   'height' : paperSize
  // });

  // // scale each path's stroke-width individually
  // _.each(qd.paths, function(path) {
  //   if (!path._originalStrokeWidth) {
  //     path._originalStrokeWidth = +path.attr('stroke-width');
  //   }

  //   path.attr({
  //     'stroke-width': path._originalStrokeWidth * zoom
  //   });
  // });

  // // build the transform string
  // var transformString = [
  //   's' + zoom,
  //   zoom,
  //   (qd._previousSize / 2),
  //   (qd._previousSize / 2),
  //   't' + ((qd._size - qd._previousSize) / 2) / 2,
  //   ((qd._size - qd._previousSize) / 2) / 2
  // ].join(',');

  // // scale the paths and adjust their position
  // qd.paths.transform(transformString);

  // qd.reflow();
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

    // remember these coordinates
    // this is to assist drag.stop() as touchend
    // doesn't return any coordinates
    qd._coordsCache = coords;
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
    // stop drawing
    qd._drawing = false;

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
  if (!qd._dragging) {
    qd._dragging = true;
    qd.events.drag._origin = coords;
    qd.events.drag._maxOffset = {
      x: $win.width() - qd._size,
      y: $win.height() - qd._size
    };
  }
}

// handles the mousemove events to reposition the canvas
qd.events.drag.move = _.throttle(function(coords) {
  if (qd._dragging) {
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
  if (qd._dragging) {
    // stop dragging
    qd._dragging = false;

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

// ==============
// Events: Pen UI
// ==============

qd.events.penSize = {};

qd.events.penSize.start = function(e) {
  if (!qd._penSizing) {
    qd._penSizing = true;
    e.preventDefault();
    e.stopPropagation();
    qd._bodyClass = qd.$body.attr('class');
    qd.$body.removeClass('crosshair move');
  }
}

qd.events.penSize.move = function(e, coords) {
  if (qd._penSizing) {
    e.preventDefault();
    e.stopPropagation();

    var radius = qd.options.pen.size[1] / 2,
        center = { x: radius + 10, y: radius + 10 };

    var distance = { x: coords.x - center.x, y: coords.y - center.y };

    radius = Math.sqrt((distance.x * distance.x) + (distance.y * distance.y));
    qd.pen.size(radius * 2);
  }
}

qd.events.penSize.stop = function(e) {
  if (qd._penSizing) {
    e.preventDefault();
    e.stopPropagation();
    qd._penSizing = false;
    qd.$body.addClass(qd._bodyClass);
    delete qd._bodyClass;
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
    x: (qd._size - w) / 2,
    y: (qd._size - h) / 2
  };

  // set the #window element's size to match the main window
  qd.$window.width(w).height(h);

  // center the viewport
  qd.$canvas.css({ left: -qd.offset.x, top: -qd.offset.y });

}

// ==========
// Initialize
// ==========

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

  qd.canvas = Raphael('canvas', qd._size, qd._size);
  qd.ui     = Raphael('ui', '100%', '100%');

  // store the collection of paths
  qd.paths = qd.canvas.set();

  // store the collection of undos
  qd.undos = qd.canvas.set();

  // draw the edge
  qd.canvas.rect(0, 0, '100%', '100%').attr({
    'fill'   : '#eee',
    'stroke' : 'none'
  });

  // draw a "canvas"
  qd.paper = qd.canvas.rect(qd._margin, qd._margin, (qd._size - (qd._margin * 2)), (qd._size - (qd._margin * 2))).attr({
    'fill'         : 'white',
    'stroke'       : '#ccc',
    'stroke-width' : 1
  });

  var radius = qd.options.pen.size[1] / 2,
      center = { x: radius + 10, y: radius + 10 };

  qd.ui.circle(center.x, center.y, radius).attr({
    'fill'    : '#eee',
    'stroke'  : 'none',
    'opacity' : 0.75
  });

  qd.pen.ui = qd.ui.circle(center.x, center.y, qd.pen._size / 2).attr({
    'fill'    : qd.pen._color,
    'stroke'  : 'none',
    'opacity' : qd.pen._opacity
  });

  qd.pen.uiOverlay = qd.ui.circle(center.x, center.y, radius).attr({
    'fill'    : 'white',
    'stroke'  : 'none',
    'opacity' : 0
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

  // =========
  // Keymaster
  // =========

  // shortcut to change pen colour & opacity
  _.each([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 ], function(num, i) {
    // opacity: number keys
    key('' + num, function() { qd.pen.opacity(num ? +('0.' + num) : 1); });
    // colour: shift + number keys
    key('shift+' + num, function() { qd.pen.color(qd._colors[i]); });
  });

  // revert to defaults
  key('d', function() {
    qd.pen.size(10);
    qd.pen.opacity(1);
    qd.pen.color('black');
    qd.pen.eraserSize(10);
  });

  // ======
  // jQuery
  // ======

  // mousewheel support
  $win.on('mousewheel', _.throttle(function(e, delta) {
    var attr = qd.pen._mode == 'draw' ? 'size' : 'eraserSize';
    if (delta > 0) {
      qd.pen[attr](qd.pen['_' + attr] + 1);
    } else {
      qd.pen[attr](qd.pen['_' + attr] - 1);
    }
  }, 15));

  // swap modes temporarily while shift key held down
  var _modeCache;
  $doc.on('keydown', function(e) {
    if (e.which == 16) {
      qd._shift = true;
      _modeCache = qd._mode;
      qd.mode(_modeCache == 'draw' ? 'drag' : 'draw');
    }
  }).on('keyup', function(e) {
    if (e.which == 16) {
      qd.mode(_modeCache);
      delete qd._shift;
    }
  });

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

    // slightly delay triggering touchmove
    qd._touchMoves = 0;

    // track only the original touch
    if (!qd._trackTouch || !qd._touchCache) {
      qd._trackTouch = e.originalEvent.targetTouches[0].identifier;
      qd._touchCache = normalizeTouchEventCoordinates(e);
    }

    // assume the mode, but do nothing (yet)
    // we may receive a 2nd touchstart indicating a drag; only
    // trigger a change if a touchmove event hasn't yet fired
    if (e.originalEvent.targetTouches.length === 1) {
      qd.mode('draw');
    } else if (!qd._drawing) {
      qd.mode('drag');
    }
  }).on('touchmove', function(e) {
    e.preventDefault();

    // only trigger once a threshhold has been reached
    qd._touchMoves++;

    // handle the event differently depending on
    // whether we're drawing or dragging
    if (qd._touchMoves > 3 && e.originalEvent.targetTouches[0].identifier == qd._trackTouch) {
      if (qd._mode == 'draw') {
        if (!qd._drawing) { qd.events.draw.start(coordinatesWithOffset(qd._touchCache)); }
        qd.events.draw.move(normalizeTouchEventCoordinatesWithOffset(e));
      } else {
        // currently, factor in the coordinates of the first touch only
        if (!qd._dragging) { qd.events.drag.start(qd._touchCache); }
        qd.events.drag.move(normalizeTouchEventCoordinates(e));
      }
    }
  }).on('touchend', function(e) {
    e.preventDefault();
    if (qd._trackTouch) {
      if (qd._mode == 'draw') {
        if (!qd._drawing) { qd.events.draw.start(coordinatesWithOffset(qd._touchCache)); }
        qd.events.draw.stop({ x: 0, y: 0 });
      } else {
        qd.events.drag.stop({ x: 0, y: 0 });
      }

      delete qd._trackTouch;
      delete qd._touchCache;
      delete qd._touchMoves;
    }
  });

  // ========================
  // Handlers: touch (pen UI)
  // ========================

  $(qd.pen.uiOverlay.node).on('mousedown touchstart', function(e) {
    qd.events.penSize.start(e);
  }).on('mousemove touchmove', function(e) {
    qd.events.penSize.move(e, (e.type == 'mousemove' ? normalizeEventCoordinates(e) : normalizeTouchEventCoordinates(e)));
  }).on('mouseup mouseleave touchend', function(e) {
    qd.events.penSize.stop(e);
  });

});
