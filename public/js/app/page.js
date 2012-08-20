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

  // Get the ownership of the drawing - the value of this
  // cookie should be a random 7-character string
  qd.owner = $.cookie('_qd_' + qd.id).length == 7;

})();

$(function() {

  // ===
  // DOM
  // ===

  // Store references to DOM elements
  qd.$body   = $('body');
  qd.$window = $('#window');
  qd.$canvas = $('#canvas');

  // Set the correct cursor by setting the mode
  qd.mode(qd._mode);

  // Set up the page dimensions & position
  qd.reflow(true);

  // =======
  // Raphael
  // =======

  // Two canvases: one for the drawing canvas, the other for the UI elements
  qd.canvas = Raphael('canvas', qd._size, qd._size);
  qd.ui     = Raphael('ui', '100%', '100%');

  // Drawing canvas: draw the visual "edge"
  qd.canvas.rect(0, 0, '100%', '100%').attr({
    'fill'   : '#eee',
    'stroke' : 'none'
  });

  // Drawing canvas: draw a visual "canvas"
  qd.canvas.rect(30, 30, qd._size - 60, qd._size - 60).attr({
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

});