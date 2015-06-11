(function (app) {

  // Notes
  // -----

  // - Need to freeze permanent points whose curves won't change
  // - May need to try to detect sharp change in direction, and
  //   force an additional point (or points) around the apex

  // Constants
  // ---------

  var XMLNS = 'http://www.w3.org/2000/svg';
  var SVG   = document.getElementById('svg');

  // Classes
  // -------

  function Point(x, y) {
    if (typeof x === 'number') this.init(x, y);
  }

  Point.prototype = {
    init: function init(x, y) {
      this.x = x || 0;
      this.y = y || 0;
      this.timestamp = Date.now();
    },

    release: function release() {
      Point.pool.push(this);
    },

    toArray: function toArray() {
      return [ this.x, this.y ];
    },

    // L  x,y
    lineTo: function lineTo() {
      return 'L' + this.toArray().join(',');
    },

    // C  c1x,c1y  c2x,c2y  x,y
    curveTo: function curveTo() {
      if (!this.bezier) return '';
      var cp1 = this.cp1.toArray().join(',');
      var cp2 = this.cp2.toArray().join(',');
      var point = this.toArray().join(',');
      return 'C' + [ cp1, cp1, point ].join(' ');
    },

    clone: function clone() {
      return Point.get(this.x, this.y);
    },

    distance: function distance(point) {
      var x = this.x - point.x;
      var y = this.y - point.y;
      return Math.sqrt((x*x) + (y*y));
    },

    equalTo: function equals(point) {
      this.x === point.x && this.y === point.y;
    }
  }

  Point.pool = [];
  while (Point.pool.length < 1000) {
    Point.pool.push(new Point());
  }

  Point.get = function (x, y) {
    if (this.pool.length === 0) {
      return new Point(x, y);
    } else {
      var point = this.pool.pop();
      point.init(x, y);
      return point;
    }
  }

  function Path(origin, opts) {
    this.points = { live: [], permanent: [] };
    this.origin = origin.clone();
    this.endLive = this.origin;
    this.endPermanent = this.origin;
    this.d = 'M' + [ this.origin.x, this.origin.y ].join(',') + ' ';

    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', opts.colour);
    this.el.setAttribute('stroke-width', opts.size);
    SVG.insertBefore(this.el, null);
  }

  Path.prototype = {
    update: function update(point, setPermanent) {
      if (!setPermanent && point.equalTo(this.endLive)) return;
      this.endLive = point = point.clone();
      this.points.live.push(point);

      this.motion(point, this.endPermanent);

      var threshold = (1 + point.velocity * 10) * 3;
      if (threshold < 10) threshold = 10;
      var distance = point.distance(this.endPermanent);
      if (!setPermanent && distance < threshold) return;

      this.endPermanent = point;
      this.points.permanent.push(point);
      this.points.live = [];
    },

    render: function render() {
      var bezier = this.points.permanent.length > 1;
      if (bezier) this.generateCurves();

      var permanent = this.points.permanent.map(function (point) {
        return bezier ? point.curveTo() : point.lineTo();
      }).join(' ');

      var live = this.points.live.map(function (point) {
        return point.lineTo();
      }).join(' ');

      var d = this.d + [ permanent, live ].join(' ');
      this.el.setAttribute('d', d);
    },

    // Catmull-Rom
    generateCurves: function generateCurves() {
      var points = this.points.permanent;
      var origin = this.origin;

      points.every(function (point, i) {
        if (i === 0) {
          var previousPoint = origin;
          var nextPoint = points[i];
          var farPoint = points[i+1];
        } else {
          var previousPoint = points[i-1];
          var nextPoint = points[i+1];
          var farPoint = points[i+2];
        }

        previousPoint = previousPoint || point;
        farPoint = farPoint || nextPoint;

        if (!farPoint) return false;

        nextPoint.bezier = true;

        var cp1x = Math.round((-previousPoint.x + 6 * point.x + nextPoint.x) / 6);
        var cp1y = Math.round((-previousPoint.y + 6 * point.y + nextPoint.y) / 6);
        nextPoint.cp1 = Point.get(cp1x, cp1y);

        var cp2x = Math.round((point.x + 6 * nextPoint.x - farPoint.x) / 6);
        var cp2y = Math.round((point.y + 6 * nextPoint.y - farPoint.y) / 6);
        nextPoint.cp2 = Point.get(cp2x, cp2y);

        return true;
      });
    },

    // Returns direction and velocity for `point`
    motion: function motion(point, previousPoint) {
      if (!previousPoint) return;
      var time = point.timestamp - previousPoint.timestamp;
      var distance = point.distance(previousPoint);
      var velocity = distance / time;
      var angle = Math.atan2(previousPoint.y - point.y, previousPoint.x - point.x);
      point.velocity = velocity;
      point.angle = angle;
    }
  }

  var _velocity = 0;

  // Main loop
  // ---------

  requestAnimationFrame(function loop() {

    // Is drawing if mousedown
    if (app.state.mousedown) {

      // If not previously drawing, set up path
      if (!app.state.drawing) {
        app.setupPath();
        app.state.drawing = true;
      }

      app.handleDraw();

    // If was previously drawing, cache the path
    } else if (app.state.drawing) {

      app.path.update(app.state.pointer, true);
      app.path.render();
      app.paths.push(app.path);
      app.path = null;
      app.state.drawing = false;

    }

    // Infinite loop
    requestAnimationFrame(loop);

  });

  // State
  // -----

  app.path = null;
  app.paths = [];

  app.state = {
    mousedown: false,
    drawing: false,
    pointer: new Point(),
    colour: '#000',
    size: 10
  }

  app.mouseup = function mouseup(e) {
    app.state.mousedown = false;
  }

  window.addEventListener('mouseup', app.mouseup);
  window.addEventListener('mouseleave', app.mouseup);

  app.mousemove = function mousemove(e) {
    app.state.mousedown = e.which === 1;
    app.state.pointer.x = e.pageX;
    app.state.pointer.y = e.pageY;
  }

  window.addEventListener('mousemove', app.mousemove);
  window.addEventListener('mousedown', app.mousemove);

  // Drawing
  // -------

  app.setupPath = function setupPath() {
    app.path = new Path(app.state.pointer, {
      colour: app.state.colour,
      size: app.state.size
    });
  }

  app.handleDraw = function handleDraw() {
    app.path.update(app.state.pointer);
    app.path.render();
  }

})({});
