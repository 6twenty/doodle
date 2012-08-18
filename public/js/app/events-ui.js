// ============
// events-ui.js
// ============
// 
// Event handlers to respond to events on UI items.

;(function() {

  // handles the first mousedown/touchstart event on the pen UI
  qd.events.penSize.start = function(e) {
    if (!qd._penSizing) {
      qd._penSizing = true;
      e.preventDefault();
      e.stopPropagation();
      qd._bodyClass = qd.$body.attr('class');
      qd.$body.removeClass('crosshair move');
    }
  }

  // handles the mousemove/touchmove events to update the current pen size
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

  // handles the mouseup/mouseleave/touchend events to finish updating the pen size
  qd.events.penSize.stop = function(e) {
    if (qd._penSizing) {
      e.preventDefault();
      e.stopPropagation();
      qd._penSizing = false;
      qd.$body.addClass(qd._bodyClass);
      delete qd._bodyClass;
    }
  }

})();