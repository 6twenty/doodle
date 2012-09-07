// ============
// shortcuts.js
// ============
// 
// Shortcut command handlers for both keyboard and touch devices.

;(function() {

  // ======
  // jQuery
  // ======

  // swap modes temporarily while shift key held down,
  // and track the state of the shift and alt keys
  var _modeCache;
  $doc.on('keydown', function(e) {
    if (e.which == 16) {
      qd._shift = true;
      _modeCache = qd._mode;
      qd._owner && qd.mode(_modeCache == 'draw' ? 'drag' : 'draw');
    } else if (e.which == 18) {
      qd._alt = true;
    }
  }).on('keyup', function(e) {
    if (e.which == 16) {
      // force current draw/drag to end
      qd.events[qd._mode].stop({ x: 0, y: 0 });
      qd._owner && qd.mode(_modeCache);
      qd._shift = false;
    } else if (e.which == 18) {
      qd._alt = false;
    }
  });

  // =========
  // Keymaster
  // =========

  // shortcut to change pen colour & opacity
  if (qd._owner) {
    _.each([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 ], function(num, i) {
      // opacity: number keys
      key('' + num, function() { qd.pen.opacity(num ? +('0.' + num) : 1); });
      // colour: shift + number keys
      key('shift+' + num, function() { qd.pen.color(qd.options.pen.color[i]); });
    });
  }

  // revert to defaults
  if (qd._owner) {
    key('d', function() {
      _.each([ 'color', 'size', 'eraserSize', 'opacity' ], function(attr) {
        qd.pen[attr](qd.defaults.pen[attr]);
      });
    });
  }

  // undo & redo
  if (qd._owner) {
    key('command+z, control+z', qd.undo);
    key('command+shift+z, control+shift+z', qd.redo);
  }

  // toggle the help window
  // key('/, shift+/', function() {
  //   if (qd.help._open) {
  //     qd.help.set.transform('T0,-1000');
  //     qd.help._open = false;
  //   } else {
  //     qd.help.set.transform('T0,0');
  //     qd.help._open = true;
  //   }
  // });

  // close the help window
  // key('esc', function() {
  //   qd.help.set.transform('T0,-1000');
  //   qd.help._open = false;
  // });

  // =====
  // Shake
  // =====

  // shake to undo
  qd._owner && $win.on('shake', qd.undo);

  // ==========
  // Mousewheel
  // ==========

  // scroll with mousewheel to change pen size
  // hold shift as well to change opacity instead
  var degrees = { opacity: 0.03, size: 1.3 };
  $win.on('mousewheel', _.throttle(function(e, delta) {
    if (!qd._drawing && !qd._sliding && !qd._sizing) {
      var attr   = qd.pen._mode == 'erase' ? 'eraserSize' : 'size',
          degree = degrees[qd._shift ? 'size' : 'opacity'],
          neg    = delta < 0,
          prop   = qd._shift ? attr : 'opacity';

      if (!qd._shift && !qd._alt) {
        degree = qd._zoom * 0.03;
        if (degree < 0.01) { degree = 0.01; }
      }

      // adjust direction
      if (!neg) { degree = -degree; }

      // apply the change
      if (qd._alt || qd._shift) {
        qd._owner && qd.pen[prop](qd.pen['_' + prop] + degree);
      } else {
        qd.zoom(qd._zoom + degree);
      }
    }
  }, 30));

})();