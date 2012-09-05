// =========
// ui-pen.js
// =========
// 
// Build the UI elements representing the pen.

$(function() {
  if (qd.owner) {

    var radius = qd.options.pen.size[1] / 2,
        center = { x: radius + 20, y: radius + 20 };

    qd.ui._radius = radius;
    qd.ui._center = center;

    // pattern fill for the outer ring
    qd.ui.circle(center.x, center.y, radius + 3).attr({
      'fill' : 'url(/img/pattern.png)'
    });

    // shadow (a) for the outer ring
    qd.ui.circle(center.x + 1, center.y + 1, radius + 3).attr({
      'fill'          : 'none',
      'stroke'        : '#000',
      'stroke-width'  : 6,
      'opacity'       : 0.5
    });

    // shadow (b) for the outer ring
    qd.ui.circle(center.x + 2, center.y + 2, radius + 3).attr({
      'fill'          : 'none',
      'stroke'        : '#000',
      'stroke-width'  : 6,
      'opacity'       : 0.25
    });

    // the outer ring
    qd.ui.circle(center.x, center.y, radius + 3).attr({
      'stroke'        : '#fff',
      'stroke-width'  : 6
    });

    // the inner circle (pen)
    qd.pen.uiPen = qd.ui.circle(center.x, center.y, qd.pen._size / 2).attr({
      'fill'    : qd.pen._color,
      'stroke'  : 'none',
      'opacity' : qd.pen._opacity
    });

    // progress bar
    qd.pen.progress = qd.ui.path().attr({
      'fill'            : 'none',
      'stroke'          : "#7799ff",
      'stroke-width'    : 6,
      'stroke-linecap'  : 'square',
      'opacity'         : 1,
      'arc'             : [center.x, center.y, 100, 100, radius + 3]
    });

    // progress bar dot
    qd.pen.progressDot = qd.ui.circle(center.x, center.y - radius - 3, 2).attr({
      'fill'    : '#000',
      'stroke'  : 'none',
      'opacity' : 0.5
    });

    // invisible hit area: pen ui
    qd.pen.uiArea = qd.ui.circle(center.x, center.y, radius + 6).attr({
      'fill'    : '#fff',
      'opacity' : 0
    });

    // block event propagation
    qd.stopPropagation(qd.pen.uiArea);

    // invisible hit area: ring
    qd.pen.uiRing = qd.ui.circle(center.x, center.y, radius + 9).attr({
      'stroke'        : '#fff',
      'stroke-width'  : 18,
      'opacity'       : 0
    });

    // toggle cursor
    qd.pen.uiRing.hover(function() {
      if (!qd._drawing && !qd._dragging) {
        qd.$body.css('cursor',  qd._sizing ? 'default' : 'pointer');
      }
    }, function() {
      if (!qd._drawing && !qd._dragging) {
        qd.$body.css('cursor', '');
      }
    });

    // block event propagation
    qd.stopPropagation(qd.pen.uiRing);

    // toggle cursor
    qd.pen.uiArea.hover(function() {
      if (!qd._drawing && !qd._dragging) {
        qd.$body.css('cursor', 'default');
      }
    }, function() {
      if (!qd._drawing && !qd._dragging) {
        qd.$body.css('cursor', '');
      }
    });

  }
});