(function () {

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
    this.points = { live: [], flux: [], frozen: [] };
    this.origin = origin.clone();
    this.endLive = this.origin;
    this.endFlux = this.origin;
    this.d = 'M' + this.origin.toString() + ' ';

    this.el = document.createElementNS(XMLNS, 'path');
    this.el.setAttribute('stroke', opts.colour);
    this.el.setAttribute('stroke-width', opts.size);
    SVG.insertBefore(this.el, null);
  }

  Path.prototype = {
    update: function update(point) {
      var distance = point.distance(this.endLive);
      if (distance === 0) return;
      this.endLive = point.clone();
      this.points.live.push(this.endLive);

      distance = this.endLive.distance(this.endFlux);
      if (distance < 30) return;
      this.endFlux = this.endLive;
      this.points.flux.push(this.endFlux);
      this.points.live = [];
    },

    // need to "freeze" flux points whose curves won't change
    render: function render() {
      var flux;
      if (this.points.flux.length < 10) {
        flux = this.points.flux.map(function (point) {
          return 'L' + point.toString();
        }).join(' ');
      } else {
        flux = catmullRom2bezier(this.flatten('flux'));
      }

      var live = this.points.live.map(function (point) {
        return 'L' + point.toString();
      }).join(' ');

      var d = this.d + [ flux, live ].join(' ');
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
