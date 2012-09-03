// ===========
// handlers.js
// ===========
// 
// Binds to mouse and touch events, delegating to appropriate
// event handlers to manage drawing and dragging on the canvas.

$(function() {

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