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

      // position the canvas in the viewport
      qd._transform.t = 'T' + [ offset.x, offset.y ].join(',');
      qd.paths.transform(qd._transform.toString());
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

      qd.offset = offset;
      delete qd.events.drag._origin;
    }
  }

})();