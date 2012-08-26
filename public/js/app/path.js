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

    // cache the pen attributes
    path.attrs = {};

    // point to the start of the path
    path.moveTo = function(x, y) {
      // add a paper.Segment to the _segments array
      path._segments.push(new paper.Segment(x, y));

      // assign the path's attributes
      path.attrs = qd.path.attrs();

      // begin the SVG path string with an M command
      // and append an L command to begin the drawing
      path._string = 'M' + [x, y].join(',') + 'L' + [x, y].join(',');
      path._raphael = qd.canvas.path(path._string).attr(path.attrs);

      // cache the base stroke width
      path._penSize = path.attrs['stroke-width'] / qd._zoom;

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

    // private function to apply the smoothing algorithm
    function simplify(tolerance) {
      var fitter = new paper.PathFitter(path, tolerance);
      path._segments = fitter.fit();
    }

    // private function to adjust a segment's position
    // to account for the scale offset
    function repositionSegmentForScale(segment) {
      // get the distance to the center of the viewport
      var distance = {
        x: segment.point.x - qd.center.x,
        y: segment.point.y - qd.center.y
      }

      // account for the zoom level
      distance.x = distance.x / qd._zoom;
      distance.y = distance.y / qd._zoom;

      // set the new coordinates
      segment.point.x = qd.center.x + distance.x;
      segment.point.y = qd.center.y + distance.y;
    }

    // private function to adjust a segment's position
    // to account for the pan offset
    function repositionSegmentForOffset(segment) {
      segment.point.x = segment.point.x + (qd.offset.x / qd._zoom);
      segment.point.y = segment.point.y + (qd.offset.y / qd._zoom);
    }

    // private function to replace the raphael path
    function replacePath(newPath) {
      // update the current path
      path._raphael.attr('path', newPath);

      // adjust the position to account for the current offset
      path._raphael.transform(qd._transform.toString());
    }

    // simplify and redraw the path, factoring in 
    // the current pan offset and zoom factor
    path.finalize = function(tolerance) {
      var newPath, applySmoothing = path._segments.length > 3;

      // apply smoothing
      applySmoothing && simplify(tolerance);

      // build a new SVG string for the path
      var previousSegment; newPath = 'M';
      _.each(path._segments, function(segment, i) {
        // account for current scale (position)
        repositionSegmentForScale(segment);

        // account for current scale (handles)
        if (applySmoothing) {
          segment.handleIn.x = segment.handleIn.x / qd._zoom;
          segment.handleIn.y = segment.handleIn.y / qd._zoom;
          segment.handleOut.x = segment.handleOut.x / qd._zoom;
          segment.handleOut.y = segment.handleOut.y / qd._zoom;
        }

        // account for current pan offset
        repositionSegmentForOffset(segment);

        // convert coordinates to apply as an SVG string
        var x = segment.point.x;
        var y = segment.point.y;
        if (applySmoothing && previousSegment) {
          var x1 = previousSegment.point.x + previousSegment.handleOut.x;
          var y1 = previousSegment.point.y + previousSegment.handleOut.y;
          var x2 = segment.point.x + segment.handleIn.x;
          var y2 = segment.point.y + segment.handleIn.y;
        }

        // first point defines the starting point;
        // subsequent points are joined by a curve (if smoothed)
        // or a line
        if (applySmoothing) {
          if (!i) { newPath += [ x, y ].join(' ') + 'C'; }
          else { newPath += [ x1, y1, x2, y2, x, y ].join(' ') + ' '; }
        } else {
          if (!i) { newPath += [ x, y ].join(' ') + 'L'; }
          else { newPath += [ x, y ].join(' ') + ' '; }
        }

        // expose this segment to the next iteration
        previousSegment = segment;
      });

      // update the path
      replacePath(newPath);
    }

  }

})();