// ==============
// events-zoom.js
// ==============
// 
// Event handler to respond to touchmove events that trigger zooming.

;(function() {

  qd.events.zoom = _.throttle(function(coords) {
    var a = coords.b.x - coords.a.x,
        b = coords.a.y - coords.b.y;

    a = a * a;
    b = b * b;

    var distance = Math.sqrt(a + b);

    if (!qd._touchDistance) {
      qd._touchDistance = distance;
      qd._zoomCache = qd._zoom;
    } else {
      var factor = distance / qd._touchDistance;
      qd.zoom(qd._zoomCache * factor);
    }
  }, 15);

})();