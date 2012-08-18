// qd.init = function() {

//   // private(ish), zooms to the given zoom level
//   // by scaling the canvas and all paths
//   qd._zoomTo = function(zoom) {
//     // scale the canvas
//     qd.canvas.setSize(qd._size, qd._size);

//     // scale the margin
//     qd.paper.attr({
//       'x'      : qd._margin,
//       'y'      : qd._margin,
//       'width'  : qd._size - (qd._margin * 2),
//       'height' : qd._size - (qd._margin * 2)
//     });

//     // reposition the paths and adjust their stoke
//     _.each(qd.paths, function(path) {
//       // position
//       path.transform('T' + ((qd._size - qd._previousSize) / 2) + ',' + ((qd._size - qd._previousSize) / 2) + 's' + [ zoom, zoom, (qd._previousSize / 2), (qd._previousSize / 2) ].join(','));

//       // stroke
//       if (!path._originalStrokeWidth) {
//         path._originalStrokeWidth = +path.attr('stroke-width');
//       }

//       path.attr({
//         'stroke-width': path._originalStrokeWidth * zoom
//       });
//     });

//     // adjust
//     // TODO: is this necessary?
//     qd.reflow();
//   }

//   // =========
//   // DOM setup
//   // =========

//   $(function() {

//     // TODO: rewrite these functions to make them easier on touch devices

//     $(qd.pen.uiOverlay.node).on('mousedown touchstart', function(e) {
//       qd.events.penSize.start(e);
//     }).on('mousemove touchmove', function(e) {
//       qd.events.penSize.move(e, (e.type == 'mousemove' ? normalizeEventCoordinates(e) : normalizeTouchEventCoordinates(e)));
//     }).on('mouseup mouseleave touchend', function(e) {
//       qd.events.penSize.stop(e);
//     });

//   });

// };