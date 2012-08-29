// ==============
// events-draw.js
// ==============
// 
// Event handlers to respond to draw events.

;(function() {

  // handles the first mousedown/touchstart event to start a drawing path
  qd.events.draw.start = function(coords) {
    if (!qd._drawing) {
      qd._drawing = true;

      // set up the path and begin drawing
      qd._path = new qd.Path();
      qd._path.moveTo(coords.x, coords.y);

      // remember these coordinates
      // this is to assist drag.stop() as touchend
      // doesn't return any coordinates
      qd._coordsCache = coords;
    }
  }

  // throttled
  // handles the mousemove/touchmove events to extend the current drawing path
  qd.events.draw.move = _.throttle(function(coords) {
    if (qd._drawing) {
      // extend the path drawing
      qd._path.lineTo(coords.x, coords.y);

      // remember these coordinates
      // this is to assist drag.stop() as touchend
      // doesn't return any coordinates
      qd._coordsCache = coords;
    }
  }, 15);

  // handles the mouseup/mouseleave/touchend events to complete the drawing path
  qd.events.draw.stop = function(coords) {
    if (qd._drawing) {
      // stop drawing
      qd._drawing = false;

      // show the spinner
      qd.loader.show();

      // touchend events return 0, 0 so use the previous touchmove coordinates
      if (!coords.x && !coords.y) {
        coords = qd._coordsCache;
        delete qd._coordsCache;
      }

      // extend the path drawing
      qd._path.lineTo(coords.x, coords.y);

      // smooth the path and account for current pan offset & zoom factor
      qd._path.finalize(qd.pen._mode == 'draw' ? (qd.pen._size * 2.5) : 1);

      // clear the redo log
      qd.undos.clear();

      // add this path to the collection
      qd.paths.push(qd._path);

      // send the new path to the server
      qd.server.patch(qd._path);

      // delete the reference
      delete qd._path;
    }
  }

})();