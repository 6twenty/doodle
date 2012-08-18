// ==========
// ui-help.js
// ==========
// 
// Build the UI elements representing the help
// dialog window.

$(function() {

  qd.help.set = qd.ui.set();

  // help container shadow (a)
  var a = qd.ui.rect(51, 51, $win.width() - 99, $win.height() - 99, 12).attr({
    'fill'         : 'none',
    'stroke'       : '#000',
    'stroke-width' : 2,
    'opacity'      : 0.25,
  });

  // help container shadow (b)
  var b = qd.ui.rect(51, 51, $win.width() - 98, $win.height() - 98, 14).attr({
    'fill'         : 'none',
    'stroke'       : '#000',
    'stroke-width' : 2,
    'opacity'      : 0.1,
  });

  // help container background
  var c = qd.help.container = qd.ui.rect(50, 50, $win.width() - 100, $win.height() - 100, 10).attr({
    'fill'    : '#fff',
    'stroke'  : 'none',
    'opacity' : 0.97,
  });

  // add to the set
  qd.help.set.push(a);
  qd.help.set.push(b);
  qd.help.set.push(c);

  // hide (out of site)
  qd.help.set.transform('T0,-1000');

  // set the cursor and stop event propagation
  qd.help.container.node.style.cursor = 'default';
  $(qd.help.container.node).on('mousedown touchstart', function(e) {
    e.stopPropagation();
  }).on('mouseup touchend mousemove touchmove', function(e) {
    if (!(qd._drawing || qd._dragging)) {
      e.stopPropagation();
    } else {
      qd.help.container.node.style.cursor = '';
    }
  });

});