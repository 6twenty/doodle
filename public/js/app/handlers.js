// ===========
// handlers.js
// ===========
// 
// Binds to mouse and touch events, delegating to appropriate
// event handlers to manage drawing and dragging on the canvas.

$(function() {

  // ============
  // Handlers: UI
  // ============

  if (qd.owner) {
    var radius        = qd.ui._radius,
        center        = qd.ui._center,
        circumference = 2 * Math.PI * (radius + 3),
        origin        = { x: center.x, y: center.y - radius - 3 };
  }

  // ring slider
  if (qd.owner) {
    qd.pen.uiRing.drag(_.throttle(function(dx, dy, x, y, e) {
      // target point
      var p1 = { x: x, y: y };

      // calculate the radius
      var r = Math.sqrt(Math.abs(p1.x - center.x) * Math.abs(p1.x - center.x) + Math.abs(p1.y - center.y) * Math.abs(p1.y - center.y));

      // virtual "12 o'clock" point
      var p0 = {
        x: center.x,
        y: center.y - r
      };

      // calculate the angle and convert to degrees and a percentage value
      var angle   = 2 * Math.atan2(p1.y - p0.y, p1.x - p0.x),
          degrees = Math.round((angle * 180 / Math.PI) * 100) / 100,
          percent = parseInt((degrees / 360) * 100),
          opacity = percent / 100.0;

      if (Math.abs(opacity - qd.pen._opacity) < 0.1) {
        // update the opacity
        qd.pen.opacity(opacity);
      } else {
        // snap if close to the extremes
        if (opacity < 0.1 || opacity > 0.9) {
          qd.pen.opacity(qd.options.pen.opacity[+(opacity < 0.1)]);
        }
      }
    }, 15), function(x, y, e) {
      qd._sliding = true;
    }, function(e) {
      qd._sliding = false;
    });
  }

  // pen resizing
  if (qd.owner) {
    qd.pen.uiArea.drag(_.throttle(function(dx, dy, x, y, e) {
      // work out the distances to the center point
      var distanceToCenter = {
        x: Math.abs(x - center.x),
        y: Math.abs(y - center.y)
      }

      // apply pythagoras
      var distance = Math.sqrt((distanceToCenter.x * distanceToCenter.x) + (distanceToCenter.y * distanceToCenter.y)),
          diff = distance - qd.pen.uiArea._distance;

      // apply the size
      var newSize = qd.pen.uiArea._sizeCache + diff;
      if (newSize < qd.options.pen.size[0]) { newSize = qd.options.pen.size[0]; }
      if (newSize > qd.options.pen.size[1]) { newSize = qd.options.pen.size[1]; }
      qd.pen.size(newSize);
    }, 15), function(x, y, e) {
      qd._sizing = true;
      // work out the distances to the center point
      var distanceToCenter = {
        x: Math.abs(x - center.x),
        y: Math.abs(y - center.y)
      }

      // apply pythagoras
      qd.pen.uiArea._distance = Math.sqrt((distanceToCenter.x * distanceToCenter.x) + (distanceToCenter.y * distanceToCenter.y));
      
      // cache the current pen size
      qd.pen.uiArea._sizeCache = qd._mode == 'draw' ? qd.pen._size : qd.pen._eraserSize;
    }, function(e) {
      qd._sizing = false;
      delete qd.pen.uiArea._distance;
      delete qd.pen.uiArea._sizeCache;
    });
  }

  // ===============
  // Handlers: mouse
  // ===============

  qd.$window.on('mousedown', function(e) {
    e.preventDefault();
    qd.events[qd._mode].start(qd.normalize.coordinates(e));
  }).on('mousemove', function(e) {
    e.preventDefault();
    qd.events[qd._mode].move(qd.normalize.coordinates(e));
  }).on('mouseup mouseleave', function(e) {
    e.preventDefault();
    qd.events[qd._mode].stop(qd.normalize.coordinates(e));
  });

  // ===============
  // Handlers: touch
  // ===============

  // TODO: track all targetTouches (or changedTouches), not just the first touch

  qd.$window.on('touchstart', function(e) {
    e.preventDefault();

    // slightly delay triggering touchmove
    qd._touchMoves = 0;

    // track only the original touch
    if (!qd._trackTouch || !qd._touchCache) {
      qd._trackTouch = e.originalEvent.targetTouches[0].identifier;
      qd._touchCache = qd.normalize.coordinates(e);
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
        if (!qd._drawing) { qd.events.draw.start(qd._touchCache); }
        qd.events.draw.move(qd.normalize.coordinates(e));
      } else {
        // multiple touches: need to track the pan motion by averaging the
        // motion of each touch, and track the zoom factor by monitoring
        // the distance between each touch
        var coords = qd.normalize.coordinates(e, true);

        if (!qd._dragging) {
          qd.events.drag.start(coords);
        }

        qd.events.drag.move(coords);
        qd.events.zoom(coords);
      }
    }
  }).on('touchend', function(e) {
    e.preventDefault();
    if (qd._trackTouch != null) {
      if (qd._mode == 'draw') {
        if (!qd._drawing) { qd.events.draw.start(qd._touchCache); }
        qd.events.draw.stop({ x: 0, y: 0 });
      } else {
        qd.events.drag.stop({ x: 0, y: 0 });
      }

      delete qd._trackTouch;
      delete qd._touchCache;
      delete qd._touchMoves;
      delete qd._touchDistance;
      delete qd._zoomCache;
    }
  });

  // ================
  // Handlers: window
  // ================

  // handles resetting the viewport center when the window size changes
  $win.resize(_.throttle(qd._center, 15));

  // handles resetting the viewport center when the orientation is changed
  $doc.on('orientationchange', qd._center);

});