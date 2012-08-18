// =========
// ui-pen.js
// =========
// 
// Build the UI elements representing the pen.

$(function() {

  var radius = qd.options.pen.size[1] / 2,
      center = { x: radius + 13, y: radius + 13 };

  // pattern fill for the outer ring
  qd.ui.circle(center.x, center.y, radius).attr({
    'fill' : 'url(/img/pattern.png)'
  });

  // shadow (a) for the outer ring
  qd.ui.circle(center.x + 1, center.y + 1, radius).attr({
    'fill'          : 'none',
    'stroke'        : '#000',
    'stroke-width'  : 6,
    'opacity'       : 0.5
  });

  // shadow (b) for the outer ring
  qd.ui.circle(center.x + 2, center.y + 2, radius).attr({
    'fill'          : 'none',
    'stroke'        : '#000',
    'stroke-width'  : 6,
    'opacity'       : 0.25
  });

  // the outer ring
  qd.pen.uiRing = qd.ui.circle(center.x, center.y, radius).attr({
    'stroke'        : '#fff',
    'stroke-width'  : 6
  });

  // the inner circle (pen)
  qd.pen.uiPen = qd.ui.circle(center.x, center.y, qd.pen._size / 2).attr({
    'fill'    : qd.pen._color,
    'stroke'  : 'none',
    'opacity' : qd.pen._opacity
  });

});