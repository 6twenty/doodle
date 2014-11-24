(function(undefined) {
  var Base = new function() {
    var hidden = /^(statics|enumerable|beans|preserve)$/,

      create = Object.create,

      describe = Object.getOwnPropertyDescriptor,

      _define = Object.defineProperty,

      define = function(obj, name, desc) {
        return _define(obj, name, desc);
      };

    function inject(dest, src, enumerable, beans, preserve) {
      var beansNames = {};

      function field(name, val) {
        val = val || (val = describe(src, name))
            && (val.get ? val : val.value);
        if (typeof val === 'string' && val[0] === '#')
          val = dest[val.substring(1)] || val;
        var isFunc = typeof val === 'function',
          res = val,
          prev = preserve || isFunc
              ? (val && val.get ? name in dest : dest[name])
              : null,
          bean;
        if (!preserve || !prev) {
          if (isFunc && prev)
            val.base = prev;
          if (isFunc && beans !== false
              && (bean = name.match(/^([gs]et|is)(([A-Z])(.*))$/)))
            beansNames[bean[3].toLowerCase() + bean[4]] = bean[2];
          if (!res || isFunc || !res.get || typeof res.get !== 'function'
              || !Base.isPlainObject(res))
            res = { value: res, writable: true };
          if ((describe(dest, name)
              || { configurable: true }).configurable) {
            res.configurable = true;
            res.enumerable = enumerable;
          }
          define(dest, name, res);
        }
      }
      if (src) {
        for (var name in src) {
          if (src.hasOwnProperty(name) && !hidden.test(name))
            field(name);
        }
        for (var name in beansNames) {
          var part = beansNames[name],
            set = dest['set' + part],
            get = dest['get' + part] || set && dest['is' + part];
          if (get && (beans === true || get.length === 0))
            field(name, { get: get, set: set });
        }
      }
      return dest;
    }

    return inject(function Base() {
      for (var i = 0, l = arguments.length; i < l; i++)
        set(this, arguments[i]);
    }, {
      inject: function(src) {
        if (src) {
          var statics = src.statics === true ? src : src.statics,
            beans = src.beans,
            preserve = src.preserve;
          if (statics !== src)
            inject(this.prototype, src, src.enumerable, beans, preserve);
          inject(this, statics, true, beans, preserve);
        }
        for (var i = 1, l = arguments.length; i < l; i++)
          this.inject(arguments[i]);
        return this;
      },

      extend: function() {
        var base = this,
          ctor;
        for (var i = 0, l = arguments.length; i < l; i++)
          if (ctor = arguments[i].initialize)
            break;
        ctor = ctor || function() {
          base.apply(this, arguments);
        };
        ctor.prototype = create(this.prototype);
        ctor.base = base;
        define(ctor.prototype, 'constructor',
            { value: ctor, writable: true, configurable: true });
        inject(ctor, this, true);
        return arguments.length ? this.inject.apply(ctor, arguments) : ctor;
      }
    }, true).inject({
      statics: {
        create: create,

        isPlainObject: function(obj) {
          var ctor = obj != null && obj.constructor;
          return ctor && (ctor === Object || ctor === Base
              || ctor.name === 'Object');
        }
      }
    });
  };

  Base.inject({

    statics: {

      exports: {},

      extend: function extend() {
        var res = extend.base.apply(this, arguments),
          name = res.prototype._class;
        if (name && !Base.exports[name])
          Base.exports[name] = res;
        return res;
      },

      read: function(list, start, options, length) {
        if (this === Base) {
          var value = this.peek(list, start);
          list.__index++;
          return value;
        }
        var proto = this.prototype,
          readIndex = proto._readIndex,
          index = start || readIndex && list.__index || 0;
        if (!length)
          length = list.length - index;
        var obj = list[index];
        if (obj instanceof this
          || options && options.readNull && obj == null && length <= 1) {
          if (readIndex)
            list.__index = index + 1;
          return obj && options && options.clone ? obj.clone() : obj;
        }
        obj = Base.create(this.prototype);
        if (readIndex)
          obj.__read = true;
        obj = obj.initialize.apply(obj, index > 0 || length < list.length
          ? Array.prototype.slice.call(list, index, index + length)
          : list) || obj;
        if (readIndex) {
          list.__index = index + obj.__read;
          obj.__read = undefined;
        }
        return obj;
      },

      peek: function(list, start) {
        return list[list.__index = start || list.__index || 0];
      },

      readAll: function(list, start, options) {
        var res = [],
          entry;
        for (var i = start || 0, l = list.length; i < l; i++) {
          res.push(Array.isArray(entry = list[i])
              ? this.read(entry, 0, options)
              : this.read(list, i, options, 1));
        }
        return res;
      },

      readNamed: function(list, name, start, options, length) {
        var value = this.getNamed(list, name),
          hasObject = value !== undefined;
        if (hasObject) {
          var filtered = list._filtered;
          if (!filtered) {
            filtered = list._filtered = Base.create(list[0]);
            filtered._filtering = list[0];
          }
          filtered[name] = undefined;
        }
        return this.read(hasObject ? [value] : list, start, options, length);
      },

      getNamed: function(list, name) {
        var arg = list[0];
        if (list._hasObject === undefined)
          list._hasObject = list.length === 1 && Base.isPlainObject(arg);
        if (list._hasObject)
          return name ? arg[name] : list._filtered || arg;
      },

      hasNamed: function(list, name) {
        return !!this.getNamed(list, name);
      }
    }
  });

  var Point = Base.extend({
    _class: 'Point',
    _readIndex: true,

    initialize: function Point(arg0, arg1) {
      var hasY = typeof arg1 === 'number';
      this.x = arg0;
      this.y = hasY ? arg1 : arg0;
      if (this.__read)
        this.__read = hasY ? 2 : 1;
    },

    set: function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },

    equals: function(point) {
      return this === point || point
          && (this.x === point.x && this.y === point.y
            || Array.isArray(point)
              && this.x === point[0] && this.y === point[1])
          || false;
    },

    clone: function() {
      return new Point(this.x, this.y);
    },

    getLength: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    getDistance: function() {
      var point = Point.read(arguments),
        x = point.x - this.x,
        y = point.y - this.y,
        d = x * x + y * y;
      return Math.sqrt(d);
    },

    normalize: function(length) {
      if (length === undefined)
        length = 1;
      var current = this.getLength(),
        scale = current !== 0 ? length / current : 0,
        point = new Point(this.x * scale, this.y * scale);
      return point;
    },

    add: function() {
      var point = Point.read(arguments);
      return new Point(this.x + point.x, this.y + point.y);
    },

    subtract: function() {
      var point = Point.read(arguments);
      return new Point(this.x - point.x, this.y - point.y);
    },

    multiply: function() {
      var point = Point.read(arguments);
      return new Point(this.x * point.x, this.y * point.y);
    },

    divide: function() {
      var point = Point.read(arguments);
      return new Point(this.x / point.x, this.y / point.y);
    },

    negate: function() {
      return new Point(-this.x, -this.y);
    },

    dot: function() {
      var point = Point.read(arguments);
      return this.x * point.x + this.y * point.y;
    }
  });

  var Segment = Base.extend({
    _class: 'Segment',

    initialize: function Segment(arg0, arg1, arg2, arg3, arg4, arg5) {
      var count = arguments.length,
        point, handleIn, handleOut;
      if (count === 0) {
      } else if (count === 1) {
        if (arg0.point) {
          point = arg0.point;
          handleIn = arg0.handleIn;
          handleOut = arg0.handleOut;
        } else {
          point = arg0;
        }
      } else if (count === 2 && typeof arg0 === 'number') {
        point = arguments;
      } else if (count <= 3) {
        point = arg0;
        handleIn = arg1;
        handleOut = arg2;
      } else {
        point = arg0 !== undefined ? [ arg0, arg1 ] : null;
        handleIn = arg2 !== undefined ? [ arg2, arg3 ] : null;
        handleOut = arg4 !== undefined ? [ arg4, arg5 ] : null;
      }
      new SegmentPoint(point, this, '_point');
      new SegmentPoint(handleIn, this, '_handleIn');
      new SegmentPoint(handleOut, this, '_handleOut');
    },

    getPoint: function() {
      return this._point;
    },

    getHandleIn: function() {
      return this._handleIn;
    },

    setHandleIn: function() {
      var point = Point.read(arguments);
      this._handleIn.set(point.x, point.y);
    },

    getHandleOut: function() {
      return this._handleOut;
    },

    setHandleOut: function() {
      var point = Point.read(arguments);
      this._handleOut.set(point.x, point.y);
    }
  });

  var SegmentPoint = Point.extend({
    initialize: function SegmentPoint(point, owner, key) {
      var x, y, selected;
      if (!point) {
        x = y = 0;
      } else if ((x = point[0]) !== undefined) {
        y = point[1];
      } else {
        var pt = point;
        if ((x = pt.x) === undefined) {
          pt = Point.read(arguments);
          x = pt.x;
        }
        y = pt.y;
      }
      this._x = x;
      this._y = y;
      owner[key] = this;
    },

    getX: function() {
      return this._x;
    },

    setX: function(x) {
      this._x = x;
    },

    getY: function() {
      return this._y;
    },

    setY: function(y) {
      this._y = y;
    },
  });

  var Path = Base.extend({
    _class: 'Path',

    initialize: function Path(arg) {
      this._closed = false;
      this._segments = [];
    },

    getSegments: function() {
      return this._segments;
    },

    setSegments: function(segments) {
      this._segments.length = 0;
      if (segments && segments.length > 0)
        this._add(Segment.readAll(segments));
    },

    _add: function(segs, index) {
      var segments = this._segments,
        amount = segs.length,
        append = index == null,
        index = append ? segments.length : index;
      for (var i = 0; i < amount; i++) {
        var segment = segs[i];
        segment._path = this;
        segment._index = index + i;
      }
      if (append) {
        segments.push.apply(segments, segs);
      } else {
        segments.splice.apply(segments, [index, 0].concat(segs));
        for (var i = index + amount, l = segments.length; i < l; i++)
          segments[i]._index = i;
      }
      return segs;
    },

    add: function(segment) {
      this._add([ Segment.read(arguments) ])[0];
    },

    simplify: function(tolerance) {
      if (this._segments.length > 2) {
        var fitter = new PathFitter(this, tolerance || 2.5);
        this.setSegments(fitter.fit());
      }
    }
  });

  var PathFitter = Base.extend({
    initialize: function(path, error) {
      this.points = [];
      var segments = path._segments,
        prev;
      for (var i = 0, l = segments.length; i < l; i++) {
        var point = segments[i].point.clone();
        if (!prev || !prev.equals(point)) {
          this.points.push(point);
          prev = point;
        }
      }
      this.error = error;
    },

    fit: function() {
      var points = this.points,
        length = points.length;
      this.segments = length > 0 ? [new Segment(points[0])] : [];
      if (length > 1)
        this.fitCubic(0, length - 1,
          points[1].subtract(points[0]).normalize(),
          points[length - 2].subtract(points[length - 1]).normalize());
      return this.segments;
    },

    fitCubic: function(first, last, tan1, tan2) {
      if (last - first == 1) {
        var pt1 = this.points[first],
          pt2 = this.points[last],
          dist = pt1.getDistance(pt2) / 3;
        this.addCurve([pt1, pt1.add(tan1.normalize(dist)),
            pt2.add(tan2.normalize(dist)), pt2]);
        return;
      }
      var uPrime = this.chordLengthParameterize(first, last),
        maxError = Math.max(this.error, this.error * this.error),
        split;
      for (var i = 0; i <= 4; i++) {
        var curve = this.generateBezier(first, last, uPrime, tan1, tan2);
        var max = this.findMaxError(first, last, curve, uPrime);
        if (max.error < this.error) {
          this.addCurve(curve);
          return;
        }
        split = max.index;
        if (max.error >= maxError)
          break;
        this.reparameterize(first, last, uPrime, curve);
        maxError = max.error;
      }
      var V1 = this.points[split - 1].subtract(this.points[split]),
        V2 = this.points[split].subtract(this.points[split + 1]),
        tanCenter = V1.add(V2).divide(2).normalize();
      this.fitCubic(first, split, tan1, tanCenter);
      this.fitCubic(split, last, tanCenter.negate(), tan2);
    },

    addCurve: function(curve) {
      var prev = this.segments[this.segments.length - 1];
      prev.setHandleOut(curve[1].subtract(curve[0]));
      this.segments.push(
          new Segment(curve[3], curve[2].subtract(curve[3])));
    },

    generateBezier: function(first, last, uPrime, tan1, tan2) {
      var epsilon = 10e-12,
        pt1 = this.points[first],
        pt2 = this.points[last],
        C = [[0, 0], [0, 0]],
        X = [0, 0];

      for (var i = 0, l = last - first + 1; i < l; i++) {
        var u = uPrime[i],
          t = 1 - u,
          b = 3 * u * t,
          b0 = t * t * t,
          b1 = b * t,
          b2 = b * u,
          b3 = u * u * u,
          a1 = tan1.normalize(b1),
          a2 = tan2.normalize(b2),
          tmp = this.points[first + i]
            .subtract(pt1.multiply(b0 + b1))
            .subtract(pt2.multiply(b2 + b3));
        C[0][0] += a1.dot(a1);
        C[0][1] += a1.dot(a2);
        C[1][0] = C[0][1];
        C[1][1] += a2.dot(a2);
        X[0] += a1.dot(tmp);
        X[1] += a2.dot(tmp);
      }

      var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1],
        alpha1, alpha2;
      if (Math.abs(detC0C1) > epsilon) {
        var detC0X  = C[0][0] * X[1]  - C[1][0] * X[0],
          detXC1  = X[0]    * C[1][1] - X[1]    * C[0][1];
        alpha1 = detXC1 / detC0C1;
        alpha2 = detC0X / detC0C1;
      } else {
        var c0 = C[0][0] + C[0][1],
          c1 = C[1][0] + C[1][1];
        if (Math.abs(c0) > epsilon) {
          alpha1 = alpha2 = X[0] / c0;
        } else if (Math.abs(c1) > epsilon) {
          alpha1 = alpha2 = X[1] / c1;
        } else {
          alpha1 = alpha2 = 0;
        }
      }

      var segLength = pt2.getDistance(pt1);
      epsilon *= segLength;
      if (alpha1 < epsilon || alpha2 < epsilon) {
        alpha1 = alpha2 = segLength / 3;
      }

      return [pt1, pt1.add(tan1.normalize(alpha1)),
          pt2.add(tan2.normalize(alpha2)), pt2];
    },

    reparameterize: function(first, last, u, curve) {
      for (var i = first; i <= last; i++) {
        u[i - first] = this.findRoot(curve, this.points[i], u[i - first]);
      }
    },

    findRoot: function(curve, point, u) {
      var curve1 = [],
        curve2 = [];
      for (var i = 0; i <= 2; i++) {
        curve1[i] = curve[i + 1].subtract(curve[i]).multiply(3);
      }
      for (var i = 0; i <= 1; i++) {
        curve2[i] = curve1[i + 1].subtract(curve1[i]).multiply(2);
      }
      var pt = this.evaluate(3, curve, u),
        pt1 = this.evaluate(2, curve1, u),
        pt2 = this.evaluate(1, curve2, u),
        diff = pt.subtract(point),
        df = pt1.dot(pt1) + diff.dot(pt2);
      if (Math.abs(df) < 10e-6)
        return u;
      return u - diff.dot(pt1) / df;
    },

    evaluate: function(degree, curve, t) {
      var tmp = curve.slice();
      for (var i = 1; i <= degree; i++) {
        for (var j = 0; j <= degree - i; j++) {
          tmp[j] = tmp[j].multiply(1 - t).add(tmp[j + 1].multiply(t));
        }
      }
      return tmp[0];
    },

    chordLengthParameterize: function(first, last) {
      var u = [0];
      for (var i = first + 1; i <= last; i++) {
        u[i - first] = u[i - first - 1]
            + this.points[i].getDistance(this.points[i - 1]);
      }
      for (var i = 1, m = last - first; i <= m; i++) {
        u[i] /= u[m];
      }
      return u;
    },

    findMaxError: function(first, last, curve, u) {
      var index = Math.floor((last - first + 1) / 2),
        maxDist = 0;
      for (var i = first + 1; i < last; i++) {
        var P = this.evaluate(3, curve, u[i - first]);
        var v = P.subtract(this.points[i]);
        var dist = v.x * v.x + v.y * v.y;
        if (dist >= maxDist) {
          maxDist = dist;
          index = i;
        }
      }
      return {
        error: maxDist,
        index: index
      };
    }
  });

  var paper = new (Base.inject(Base.exports))();
  window.Path = paper.Path;
  window.Point = paper.Point;
})();
