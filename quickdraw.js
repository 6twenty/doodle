(function () {

  // Notes
  // -----

  // - Need to freeze permanent points whose curves won't change
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
    this.d = 'M' + [ this.origin.x, this.origin.y ].join(',') + ' ';

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
      if (!setPermanent && distance < 20) return;
      this.endPermanent = this.endLive;
      this.points.permanent.push(this.endPermanent);
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
    generateCurves: function () {
      var points = this.points.permanent;

      points.every(function (point, i) {
        var previousPoint = points[i-1];
        var nextPoint = points[i+1];
        var farPoint = points[i+2];

        previousPoint = previousPoint || point;
        farPoint = farPoint || nextPoint;

        if (!farPoint) return false;

        nextPoint.bezier = true;

        nextPoint.cp1 = new Point();
        nextPoint.cp1.x = Math.round((-previousPoint.x + 6 * point.x + nextPoint.x) / 6);
        nextPoint.cp1.y = Math.round((-previousPoint.y + 6 * point.y + nextPoint.y) / 6);

        nextPoint.cp2 = new Point();
        nextPoint.cp2.x = Math.round((point.x + 6 * nextPoint.x - farPoint.x) / 6);
        nextPoint.cp2.y = Math.round((point.y + 6 * nextPoint.y - farPoint.y) / 6);

        return true;
      });
    }
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
