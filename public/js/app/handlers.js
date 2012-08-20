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

    if (qd._mode == 'draw') {
      qd.events.draw.start(qd.normalize.eventCoordinatesWithOffset(e));
    } else {
      qd.events.drag.start(qd.normalize.eventCoordinates(e));
    }
  }).on('mousemove', function(e) {
    e.preventDefault();

    if (qd._mode == 'draw') {
      qd.events.draw.move(qd.normalize.eventCoordinatesWithOffset(e));
    } else {
      qd.events.drag.move(qd.normalize.eventCoordinates(e));
    }
  }).on('mouseup mouseleave', function(e) {
    e.preventDefault();

    if (qd._mode == 'draw') {
      qd.events.draw.stop(qd.normalize.eventCoordinatesWithOffset(e));
    } else {
      qd.events.drag.stop(qd.normalize.eventCoordinates(e));
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
      qd._touchCache = qd.normalize.touchEventCoordinates(e);
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
        if (!qd._drawing) { qd.events.draw.start(qd.normalize.coordinatesWithOffset(qd._touchCache)); }
        qd.events.draw.move(qd.normalize.touchEventCoordinatesWithOffset(e));
      } else {
        // currently, factor in the coordinates of the first touch only
        if (!qd._dragging) { qd.events.drag.start(qd._touchCache); }
        qd.events.drag.move(qd.normalize.touchEventCoordinates(e));
      }
    }
  }).on('touchend', function(e) {
    e.preventDefault();
    if (qd._trackTouch) {
      if (qd._mode == 'draw') {
        if (!qd._drawing) { qd.events.draw.start(qd.normalize.coordinatesWithOffset(qd._touchCache)); }
        qd.events.draw.stop({ x: 0, y: 0 });
      } else {
        qd.events.drag.stop({ x: 0, y: 0 });
      }

      delete qd._trackTouch;
      delete qd._touchCache;
      delete qd._touchMoves;
    }
  });

  // ================
  // Handlers: window
  // ================

  // handles resetting the viewport when the window size changes
  // $win.resize(_.throttle(function() {
  //   qd.reflow();
  // }, 15));

  // handles resetting the viewport when the orientation is changed
  // $doc.on('orientationchange', qd.reflow);

});