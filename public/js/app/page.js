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

  // Get the ownership of the drawing
  qd.owner = $.cookie('qd_' + qd.id) == '1';

})();

$(function() {

  // ===
  // DOM
  // ===

  // store references to DOM elements
  qd.$body   = $('body');
  qd.$window = $('#window');
  qd.$canvas = $('#canvas');

  // set the correct cursor by setting the mode
  qd.mode(qd._mode);

  // set up the page dimensions & position
  qd.reflow(true);

  // =======
  // Raphael
  // =======

  // x2 canvases: one for the drawing canvas, the other for the UI elements
  qd.canvas = Raphael('canvas', qd._size, qd._size);
  qd.ui     = Raphael('ui', '100%', '100%');

  // drawing canvas: draw the visual "edge"
  qd.canvas.rect(0, 0, '100%', '100%').attr({
    'fill'   : '#eee',
    'stroke' : 'none'
  });

  // drawing canvas: draw a visual "canvas"
  qd.canvas.rect(30, 30, qd._size - 60, qd._size - 60).attr({
    'fill'         : 'white',
    'stroke'       : '#ccc',
    'stroke-width' : 1
  });

  // =======
  // Initial
  // =======

  // gets the initial drawing paths and renders them to the UI
  _.each(qd._initial, function(serialized) {
    var path = qd.server.deserializePath(serialized);
    qd.paths.push(path);
  });

  // remove the initial paths cache
  delete qd._initial;

});