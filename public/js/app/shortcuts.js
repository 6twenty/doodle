// ============
// shortcuts.js
// ============
// 
// Shortcut command handlers for both keyboard and touch devices.

;(function() {

  // ======
  // jQuery
  // ======

  // swap modes temporarily while shift key held down
  var _modeCache;
  $doc.on('keydown', function(e) {
    if (e.which == 16) {
      qd._shift = true;
      _modeCache = qd._mode;
      qd.mode(_modeCache == 'draw' ? 'drag' : 'draw');
    }
  }).on('keyup', function(e) {
    if (e.which == 16) {
      // force current draw/drag to end
      qd.events[qd._mode].stop({ x: 0, y: 0 });
      qd.mode(_modeCache);
      qd._shift = false;
    }
  });

  // =========
  // Keymaster
  // =========

  // shortcut to change pen colour & opacity
  _.each([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 ], function(num, i) {
    // opacity: number keys
    key('' + num, function() { qd.pen.opacity(num ? +('0.' + num) : 1); });
    // colour: shift + number keys
    key('shift+' + num, function() { qd.pen.color(qd.options.pen.color[i]); });
  });

  // revert to defaults
  key('d', function() {
    _.each([ 'color', 'size', 'eraserSize', 'opacity' ], function(attr) {
      qd.pen['_' + attr] = qd.defaults.pen[attr];
    });
  });

  // toggle the help window
  key('/, shift+/', function() {
    if (qd.help._open) {
      qd.help.set.transform('T0,-1000');
      qd.help._open = false;
    } else {
      qd.help.set.transform('T0,0');
      qd.help._open = true;
    }
  });

  // close the help window
  key('esc', function() {
    qd.help.set.transform('T0,-1000');
    qd.help._open = false;
  });

  // =====
  // Shake
  // =====

  // shake to undo
  $win.on('shake', qd.undo);

  // ==========
  // Mousewheel
  // ==========

  // scroll with mousewheel to change pen size
  // hold shift as well to change opacity instead
  var degrees = { opacity: 0.01, size: 1 };
  $win.on('mousewheel', _.throttle(function(e, delta) {
    var attr   = qd.pen._mode == 'erase' ? 'eraserSize' : 'size',
        degree = degrees[qd._shift ? 'opacity' : 'size'],
        neg    = delta < 0,
        prop   = qd._shift ? 'opacity' : attr;

    // adjust direction
    if (neg) { degree = -degree; }

    // apply the change
    qd.pen[prop](qd.pen['_' + prop] + degree);
  }, 15));

})();