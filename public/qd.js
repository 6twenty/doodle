// =======
// Options
// =======
//
// Provides restrictions against the corresponding
// objects to limit the values that can be set.

qd.options      = {};
qd.options.mode = [ 'draw', 'grab' ];

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

// ========
// Defaults
// ========

qd._mode = 'draw';

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

// store the collection of paths
qd.paths = [];

// store the collection of undos
qd.undos = [];

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

// ======
// Events
// ======

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
  }
}, 15);

// handles the mouseup & mouseleave events to complete the drawing path
qd.events.draw.stop = function(coords) {
  if (qd._drawing) {
    qd._drawing = false;

    // clear the current path references
    var pPath = qd._paperPath, rPath = qd._raphaelPath;
    delete qd._paperPath;
    delete qd._raphaelPath;

    // perform line smoothing
    // when erasing, only minimal line smoothing is applied
    pPath.simplify(qd.pen._mode == 'draw' ? (qd.pen._size * 2.5) : 1);

    // regenerate the rendered path using the smoothed paper path
    var newPath = 'M', previousSegment;
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

    // add this path to the collection
    qd.paths.push(newPath);

    // clear the redo log
    qd.undos = [];

    // send the new path to the server
    qd.server.patch(newPath);
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

// wait for the initial json data to be ready
$doc.on('qd.ready', function() {
  // wait for the dom to be ready
  $(function() {

    // ======
    // Window
    // ======

    var w = $win.width(),
        h = $win.height();

    var offset = {
      x: (3200 - w) / 2,
      y: (3200 - h) / 2
    };

    // =======
    // Raphael
    // =======

    qd.canvas = Raphael(0, 0, 3200, 3200).setViewBox(0, 0, 3200, 3200, false);
    $win.scrollLeft(offset.x).scrollTop(offset.y); // center the viewport

    // =====
    // Paper
    // =====

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

    // return an object with x and y attributes
    function normalizeEventCoordinates(e) {
      return { x: e.pageX, y: e.pageY };
    }

    // delegate events to their corresponding draw functions
    var $svg = $('svg');
    $svg.on('mousedown', function(e) {
      qd.events.draw.start(normalizeEventCoordinates(e));
    }).on('mousemove', function(e) {
      qd.events.draw.move(normalizeEventCoordinates(e));
    }).on('mouseup mouseleave', function(e) {
      qd.events.draw.stop(normalizeEventCoordinates(e));
    });

  });
});
