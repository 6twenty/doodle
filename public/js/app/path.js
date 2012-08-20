// =======
// path.js
// =======
// 
// Handles maintaining the internal paths (both Raphael and Paper.js).

;(function() {

  qd.Path = function() {
    var path = this;

    // internal cache of segments
    path._segments = [];

    // internal cache of SVG path string
    path._string = '';

    // internal cache of Raphael path element
    path._raphael = undefined;

    // point to the start of the path
    path.moveTo = function(x, y) {
      // add a paper.Segment to the _segments array
      path._segments.push(new paper.Segment(x, y));

      // begin the SVG path string with an M command
      // and append an L command to begin the drawing
      path._string = 'M' + [x, y].join(',') + 'L' + [x, y].join(',');
      path._raphael = qd.canvas.path(path._string).attr(qd.path.attrs());
      path._raphael.transform('T' + [ -qd.offset.x, -qd.offset.y ].join(','));

      return [x, y];
    }

    // draw a line from the previous point to this one
    path.lineTo = function(x, y) {
      // add a paper.Segment to the _segments array
      path._segments.push(new paper.Segment(x, y));
      
      // continue the SVG path command
      path._string += (' ' + [x, y].join(','));
      path._raphael.attr('path', path._string);

      return [x, y];
    }

    // simplify and redraw the path
    path.simplify = function(tolerance) {
      var newPath;
      if (path._segments.length > 3) {
        var fitter = new paper.PathFitter(path, tolerance);
        path._segments = fitter.fit();

        var previousSegment; newPath = 'M';
        _.each(path._segments, function(segment, i) {
          var x1 = previousSegment ? (previousSegment.point.x + previousSegment.handleOut.x) : null,
              y1 = previousSegment ? (previousSegment.point.y + previousSegment.handleOut.y) : null,
              x2 = previousSegment ? (segment.point.x + segment.handleIn.x) : null,
              y2 = previousSegment ? (segment.point.y + segment.handleIn.y) : null,
              x  = segment.point.x,
              y  = segment.point.y;

          if (i === 0) {
            // first point defines the starting point
            newPath += [ x, y ].join(' ') + 'C';
          } else {
            // subsequent points are joined by a curve
            newPath += [ x1, y1, x2, y2, x, y ].join(' ') + ' ';
          }

          // expose this segment to the next iteration
          previousSegment = segment;
        });

        // remove the current rendered path
        path._raphael.remove();

        // render the new smoothed path
        path._raphael = qd.canvas.path(newPath).attr(qd.path.attrs());
        path._raphael.transform('T' + [ -qd.offset.x, -qd.offset.y ].join(','));
      }
    }

  }

})();