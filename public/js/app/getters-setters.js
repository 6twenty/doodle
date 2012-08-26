// ==================
// getters-setters.js
// ==================
// 
// Functions to manage the state of the app
// through public API methods.

;(function() {

  // app mode (drawing or panning)
  qd.mode = function(newVal) {
    if (newVal && _.include(qd.options.mode, newVal)) {
      this._mode = newVal;
      // apply an appropriate class to the <body>
      qd.$body.removeClass('crosshair move').addClass(this._mode == 'draw' ? 'crosshair' : 'move');
      return this._mode;
    } else {
      return this._mode;
    }
  }

  // pen mode (drawing or erasing)
  qd.pen.mode = function(newVal) {
    if (newVal && _.include(qd.options.pen.mode, newVal)) {
      this._mode = newVal;
      qd.pen.update(); // update the UI
      return this._mode;
    } else {
      return this._mode;
    }
  }

  // pen color (accepts one of the preset css colours)
  qd.pen.color = function(newVal) {
    if (newVal && _.include(qd.options.pen.color, newVal)) {
      this._color = newVal;
      qd.pen.update(); // update the UI
      return this._color;
    } else {
      return this._color;
    }
  }

  // pen/eraser size, & opacity (requires valid range)
  _.each([ 'size', 'eraserSize', 'opacity' ], function(key) {
    qd.pen[key] = function(newVal) {
      var range = qd.options.pen[key];
      if (_.isFinite(newVal) && newVal >= range[0] && newVal <= range[1]) {
        this['_' + key] = +newVal.toFixed(2); // round to 2 decimal places
        qd.pen.update(); // update the UI
        return this['_' + key];
      } else {
        return this['_' + key];
      }
    }
  });

  // zoom level (requires valid range)
  qd.zoom = function(newVal) {
    var range = qd.options.zoom;
    if (_.isFinite(newVal) && newVal >= range[0] && newVal <= range[1]) {
      this._zoom = +newVal.toFixed(2);
      qd.path._attrsChanged = true;
      this.paths._scale(this._zoom);
      // adjust the offset
      qd.offset.x = qd.offset.x * this._zoom;
      qd.offset.y = qd.offset.y * this._zoom;
      return this._zoom;
    } else {
      return this._zoom;
    }
  }

})();