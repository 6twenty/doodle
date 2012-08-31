// ==========
// options.js
// ==========
// 
// Provides restrictions against the corresponding
// objects to validate and limit the values that can be set

;(function() {

  // globals
  qd.options.mode = [ 'draw', 'drag' ];
  qd.options.zoom = [ 0.1, 5 ];

  // pen
  qd.options.pen.mode       = [ 'draw', 'erase' ];
  qd.options.pen.size       = [ 1, 100 ];
  qd.options.pen.eraserSize = [ 1, 100 ];
  qd.options.pen.opacity    = [ 0.01, 1 ];
  qd.options.pen.color      = [
    '#46648e', // blue   [strong]
    '#8bbbff', // blue   [pale]
    '#89ad48', // green  [strong]
    '#d1d642', // green  [pale]
    '#8c5ba7', // purple [strong]
    '#ca76bf', // purple [pale]
    '#d7503c', // red    [strong]
    '#d17060', // red    [pale]
    '#f49f14', // yellow [strong]
    '#fae014', // yellow [pale]
    '#000000', // black  [long]
    '#000',    // black  [short]
    '#ffffff', // white  [long]
    '#fff'     // white  [short]
  ];

})();