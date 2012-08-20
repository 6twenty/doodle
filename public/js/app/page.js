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

})();

$(function() {

  // Get the ownership of the drawing - the value of this
  // cookie should be a random 7-character string
  // qd.owner = $.cookie('_qd_' + qd.id).length == 7;

  // ===
  // DOM
  // ===

  // Store references to DOM elements
  qd.$body   = $('body');
  qd.$window = $('#window');
  qd.$canvas = $('#canvas');

  // Set the correct cursor by setting the mode
  qd.mode(qd._mode);
  
  // Calculate the current window size
  var w = $win.width(),
      h = $win.height();

  // Get the center point
  qd.center = {
    x: w / 2,
    y: h / 2
  }

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
    qd.paths.add(path);
  });

  // Remove the initial paths cache from memory
  delete qd._initial;

  // Move to the center of the drawing
  if (qd.paths.set) {
    var bbox = qd.paths.set.getBBox();
    qd.events.drag.start({ x: 0, y: 0 });
    qd.events.drag.move({
      x: -(bbox.x - qd.center.x) - (bbox.width / 2),
      y: -(bbox.y - qd.center.y) - (bbox.height / 2)
    });
    qd.events.drag.stop({ x: 0, y: 0 });
  } else {
    qd.paths.initialize();
  }

});