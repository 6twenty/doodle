// ==========
// initial.js
// ==========
// 
// Sets up the initial state of the app.
// References `defaults.js`.

;(function() {

  // globals
  _.each([ 'mode', 'zoom', 'size' ], function(attr) {
    qd['_' + attr] = qd.defaults[attr];
  });

  // pen
  _.each([ 'mode', 'color', 'size', 'eraserSize', 'opacity' ], function(attr) {
    qd.pen['_' + attr] = qd.defaults.pen[attr];
  });

  // store collections of paths & undos
  qd.paths = [];
  qd.undos = [];

})();