// =============
// collection.js
// =============
// 
// An array-like object that manages an internal
// array of paths as well as a Raphael set.

;(function() {

  qd.Collection = function() {
    var collection = this;

    // Internal cache of all path items in a standard array
    collection._array = [];

    // Internal cache of raphael paths in a raphael set
    collection._set = qd.canvas.set();

    // Custom "push" function
    collection.push = function(path) {
      // push the raphael object into the set
      collection._set.push(path._raphael);
      // push the path into the array
      return collection._array.push(path);
    }

    // Custom "pop" function
    collection.pop = function() {
      // pop the raphael object from the set
      collection._set.pop();
      // pop the path from the array
      return collection._array.pop();
    }

    // Delegate functions to the raphael set
    _.each([ 'getBBox', 'transform' ], function(method) {
      collection[method] = function() {
        return collection._set[method].apply(collection._set, arguments);
      }
    });

    // Scale function
    collection._scale = function(scale) {
      qd._transform.s = 'S' + [ scale, scale, qd.center.x, qd.center.y ].join(',');
      collection.transform(qd._transform.toString());
      _.each(collection._array, function(path) {
        if (!path._penSize) { path._penSize = +path._raphael.attr('stroke-width'); }
        path._raphael.attr('stroke-width', path._penSize * scale);
      });
    }

  }

})();

  // // Custom array: scale
  // Array.prototype.scale = function(factor) {
  //   if (!this.set) { this.initialize(); }
  //   var set = this.set;
  //   qd._transform.s = 'S' + [ factor, factor, qd.center.x, qd.center.y ].join(',');
  //   set.transform(qd._transform.toString());
  //   _.each(set, function(path) {
  //     var n = +path.attr('stroke-width');
  //     path.attr('stroke-width', n * factor);
  //   });
  // }