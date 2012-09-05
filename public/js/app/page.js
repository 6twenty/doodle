// =======
// page.js 
// =======
// 
// Sets up jQuery and Raphael objects once the DOM is ready,
// and loads the initial drawing paths if available.

;(function() {

  // =======
  // General
  // =======

  // Cache document & window jquery objects
  window.$win = $(window);
  window.$doc = $(document);

  // Hijack and block right-clicks
  $doc.on('contextmenu', function() { return false; });

  // Function to get the height & width of the viewport
  // and calculate the center coordinates
  qd._center = function() {
    // Get the current window size
    var w = $win.width(),
        h = $win.height();

    // Cache
    qd.window = {
      width: w,
      height: h
    }

    // Get the center point
    qd.center = {
      x: w / 2,
      y: h / 2
    }
  }

})();

$(function() {

  // Get the ownership of the drawing - the value of this
  // cookie should be a random 7-character string
  // qd.owner = $.cookie('_qd_'); // ...

  // ===
  // DOM
  // ===

  // Store references to DOM elements
  qd.$body   = $('body');
  qd.$window = $('#window');
  qd.$canvas = $('#canvas');

  // Set the correct cursor by setting the mode
  qd.mode(qd._mode);

  // Cache the coordinates at the center of the viewport
  qd._center();

  // Track the pan offset
  qd.offset = {
    x: 0, y: 0
  }

  // Track the applied transformations
  qd._transform = {
    t: '',
    s: '',
    toString: function() {
      return [ this.t, this.s ].join('');
    }
  }

  // =======
  // Raphael
  // =======

  // Two canvases: one for the drawing canvas, the other for the UI elements
  qd.canvas = Raphael('canvas', '100%', '100%');
  qd.ui     = Raphael('ui', '100%', '100%');

  // custom arc function for the ui
  qd.ui.customAttributes.arc = function (xloc, yloc, value, total, R) {
    var alpha = 360 / total * value,
        a     = (90 - alpha) * Math.PI / 180,
        x     = xloc + R * Math.cos(a),
        y     = yloc - R * Math.sin(a),
        path;
    if (total == value) {
      path = [
        ["M", xloc, yloc - R],
        ["A", R, R, 0, 1, 1, xloc - 0.01, yloc - R]
      ];
    } else {
      path = [
        ["M", xloc, yloc - R],
        ["A", R, R, 0, +(alpha > 180), 1, x, y]
      ];
    }
    return {
      path: path
    };
  };

  // Set up the collections
  qd.paths = new qd.Collection();
  qd.undos = new qd.Collection();

  // Drawing canvas: draw a visual "canvas"
  qd.canvas.rect(0, 0, '100%', '100%').attr({
    'fill'         : 'white',
    'stroke'       : '#ccc',
    'stroke-width' : 1
  });

  // =======
  // Initial
  // =======

  // Gets the initial drawing paths and renders them to the UI
  _.each(qd._initial, function(serialized) {
    var path = qd.server.deserializePath(serialized);
    qd.paths.push(path);
  });

  // Remove the initial paths cache from memory
  delete qd._initial;

  // Move to the center of the drawing &
  // scale the drawing to fill the viewport
  if (qd.paths._array.length) {
    var bbox = qd.paths.getBBox();

    // move
    qd.events.drag.start({ x: 0, y: 0 });
    qd.events.drag.move({
      x: -(bbox.x - qd.center.x) - (bbox.width / 2),
      y: -(bbox.y - qd.center.y) - (bbox.height / 2)
    });
    qd.events.drag.stop({ x: 0, y: 0 });

    // scale
    var w = qd.window.width / (bbox.width + (qd.window.width * 0.1)),
        h = qd.window.height / (bbox.height + (qd.window.height * 0.1));
    qd.zoom(w > h ? h : w);
  }

});