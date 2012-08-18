// ==============
// events-drag.js
// ==============
// 
// Event handlers to respond to drag events.

;(function() {

  // handles the first mousedown/touchstart event to start dragging
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

  // handles the mousemove/touchmove events to reposition the canvas
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

})();