(function () {

  // Notes
  // -----

  // - Need to freeze permanent points whose curves won't change
  // - Need to "complete" the path when drawing ends:
  //   - Store last point as permanent
  //   - Generate curves again
  //   - Re-render
  // - Need to modify the distance threshold by the velocity,
  //   so that slow movements result in greater fidelity
  // - May need to try to detect sharp change in direction, and
  //   force an additional point (or points) around the apex
  //   (perhaps just keep *all* "live" points?)

  // Constants
  // ---------

  var XMLNS = 'http://www.w3.org/2000/svg';
  var SVG   = document.getElementById('svg');

  // Classes
  // -------

  function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  Point.prototype = {
    toArray: function toArray() {
      return [ this.x, this.y ];
    },

    toString: function toString() {
      return this.toArray().join(',');
    },

    clone: function clone() {
      return new Point(this.x, this.y);
    },

    distance: function distance(point) {
      var x = this.x - point.x;
      var y = this.y - point.y;
      return Math.sqrt((x*x) + (y*y));
    }
  }

  function Path(origin, opts) {
    this.points = { live: [], permanent: [], frozen: [] };
    this.origin = origin.clone();
    this.endLive = this.origin;
    this.endPermanent = this.origin;
    this.d = 'M' + this.origin.toString() + ' ';

    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', opts.colour);
    this.el.setAttribute('stroke-width', opts.size);
    SVG.insertBefore(this.el, null);
  }

  Path.prototype = {
    update: function update(point, setPermanent) {
      var distance = point.distance(this.endLive);
      if (!setPermanent && distance === 0) return;
      this.endLive = point.clone();
      this.points.live.push(this.endLive);

      distance = this.endLive.distance(this.endPermanent);
      if (!setPermanent && distance < 30) return;
      this.endPermanent = this.endLive;
      this.points.permanent.push(this.endPermanent);
      this.points.live = [];
    },

    render: function render() {
      var permanent;
      if (this.points.permanent.length < 3) {
        permanent = this.points.permanent.map(function (point) {
          return 'L' + point.toString();
        }).join(' ');
      } else {
        permanent = catmullRom2bezier(this.flatten('permanent'));
      }

      var live = this.points.live.map(function (point) {
        return 'L' + point.toString();
      }).join(' ');

      var d = this.d + [ permanent, live ].join(' ');
      this.el.setAttribute('d', d);
    },

    flatten: function flatten(set) {
      return this.points[set].reduce(function(a, b) {
        a = a instanceof Point ? a.toArray() : a;
        b = b instanceof Point ? b.toArray() : b;
        return a.concat(b);
      });
    }
  }

  // Catmull-Rom
  // -----------

  // Requires a *flat* array of numbers
  // Refactor to take an array of points (x,y pairs) instead
  // Then update the point to add the control points
  function catmullRom2bezier(crp) {
    var d = [];

    for (var i = 0, iLen = crp.length; iLen - 2 > i; i += 2) {
      var p = [
        {x: +crp[i - 2], y: +crp[i - 1]},
        {x: +crp[i],     y: +crp[i + 1]},
        {x: +crp[i + 2], y: +crp[i + 3]},
        {x: +crp[i + 4], y: +crp[i + 5]}
      ];

      if (iLen - 4 == i) {
        p[3] = p[2];
      } else if (!i) {
        p[0] = {x: +crp[i], y: +crp[i + 1]};
      }

      d.push(["C",
        [(-p[0].x + 6 * p[1].x + p[2].x) / 6, (-p[0].y + 6 * p[1].y + p[2].y) / 6].join(','),
        [( p[1].x + 6 * p[2].x - p[3].x) / 6, ( p[1].y + 6 * p[2].y - p[3].y) / 6].join(','),
        [p[2].x, p[2].y].join(',')
      ].join(' '));
    }

    return d.join('');
  }


  // Main loop
  // ---------

  requestAnimationFrame(function loop() {

    // Is drawing if mousedown
    if (this.state.mousedown) {

      // If not previously drawing, set up path
      if (!this.state.drawing) {
        this.setupPath();
        this.state.drawing = true;
      }

      this.handleDraw();

    // If was previously drawing, cache the path
    } else if (this.state.drawing) {

      this.path.update(this.state.pointer, true);
      this.path.render();
      this.paths.push(this.path);
      this.path = null;
      this.state.drawing = false;

    }

    // Infinite loop
    requestAnimationFrame(loop.bind(this));

  }.bind(this));

  // State
  // -----

  this.path = null;
  this.paths = [];

  this.state = {
    mousedown: false,
    drawing: false,
    pointer: new Point(),
    colour: '#000',
    size: 10
  }

  this.mouseup = function mouseup(e) {
    this.state.mousedown = false;
  }

  window.addEventListener('mouseup', this.mouseup.bind(this));
  window.addEventListener('mouseleave', this.mouseup.bind(this));

  this.mousemove = function mousemove(e) {
    this.state.mousedown = e.which === 1;
    this.state.pointer.x = e.pageX;
    this.state.pointer.y = e.pageY;
  }

  window.addEventListener('mousemove', this.mousemove.bind(this));
  window.addEventListener('mousedown', this.mousemove.bind(this));

  // Drawing
  // -------

  this.setupPath = function setupPath() {
    this.path = new Path(this.state.pointer, {
      colour: this.state.colour,
      size: this.state.size
    });
  }

  this.handleDraw = function handleDraw() {
    this.path.update(this.state.pointer);
    this.path.render();
  }

}).call({});
