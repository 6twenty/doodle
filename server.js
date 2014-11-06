// ==============
// Initialization
// ==============

var _          = require('lodash'),
    express    = require('express'),
    crypto     = require('crypto'),
    rs         = require('randomstring'),
    path       = require('path'),
    fs         = require('fs'),
    app        = express(),
    drawingDir = __dirname + '/drawings/',
    userDir    = __dirname + '/users/';

// =============  
// Configuration
// =============

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', function(path, options, fn) {
    fs.readFile(path, 'utf8', function(err, str) {
      if (err) { return fn(err); }
      str = str.replace('{{{ env }}}', app.settings.env);
      str = str.replace('{{{ initial }}}', options.initial);
      str = str.replace('{{{ owner }}}', options.owner);
      fn(null, str);
    });
  });
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public')); // todo: remove this and have nginx serve the static content
  app.use(express.logger());
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

var dev = app.settings.env == 'development';

// =======
// Helpers
// =======

var helpers = {};
helpers.templates = {};

// encryption
helpers.encrypt = function(text) {
  var cipher = crypto.createCipher('aes-256-cbc', 'rvjdlesbx');
  var crypted = cipher.update(text, 'utf8',' hex');
  crypted += cipher.final('hex');
  return crypted;
}

// decryption
helpers.decrypt = function(text) {
  var decipher = crypto.createDecipher('aes-256-cbc', 'rvjdlesbx');
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

// generates a new random & optionally unique code
helpers.codeGenerator = function(existing) {
  var id = rs.generate(7).toLowerCase();
  // ensure it's unique if need be
  if (existing && _.include(existing, id)) {
    return helpers.codeGenerator();
  } else {
    return id;
  }
}

// new user/drawing templates
helpers.templates.user = [];
helpers.templates.drawing = { paths: [] };

// ==========
// Middleware
// ==========

var middleware = [];

// set up the middleware cache
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: cache');

  var cache = {};
  cache.user = {};
  cache.drawing = {};
  res.locals.cache = cache;
  next();
});

// extract the drawing ID, if present
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: drawing ID');
  var cache = res.locals.cache;

  if (req.params.length) {
    var id = req.params[0];
    cache.drawing.id = id;
    cache.drawing.path = drawingDir + id + '.json';
    cache.drawing.create = false;
  } else {
    cache.drawing.create = true;
  }

  res.locals.cache = cache;
  next();
});

// extract the user ID from the cookie, if available
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: user ID');
  var cache = res.locals.cache;

  var cookie = req.cookies._qd_;
  if (cookie) {
    var id = helpers.decrypt(cookie);
    cache.user.id = id;
    cache.user.path = userDir + id + '.json';
  }

  res.locals.cache = cache;
  next();
});

// create a new user ID if need be
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: user ID');
  var cache = res.locals.cache;
  if (cache.user.id) { return next(); }

  // get the existing user IDs
  fs.readdir(userDir, function(err, files) {
    if (err) { console.log('[Error]: Unable to read users directory'); return res.send(500); }

    // get a list of existing IDs
    var ids = [];
    _.each(files, function(file) {
      // ignore non-json files
      (/\.json$/).test(file) && ids.push(+file.replace('.json', ''));
    });

    // custom sort comparison
    function compare(a, b) { return a - b; }

    // find and cache the next sequential ID
    var id = ids.length ? _.last(ids.sort(compare)) + 1 : 1;
    cache.user.id = id;
    cache.user.path = userDir + id + '.json';

    // set a cookie with the encrypted user ID
    res.cookie('_qd_', helpers.encrypt(id + ''), {
      expires: new Date(Date.now() + (3600 * 1000 * 24 * 365 * 10))
    });

    res.locals.cache = cache;
    next();
  });
});

// create a new drawing ID if need be
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: drawing ID');
  var cache = res.locals.cache;
  if (cache.drawing.id) { return next(); }

  // get the existing user IDs
  fs.readdir(drawingDir, function(err, files) {
    if (err) { console.log('[Error]: Unable to read drawings directory'); return res.send(500); }

    // get a list of existing IDs
    var ids = [];
    _.each(files, function(file) {
      // ignore non-json files
      (/\.json$/).test(file) && ids.push(file.replace('.json', ''));
    });

    // generate a new unique ID for this drawing
    var id = helpers.codeGenerator(ids);
    cache.drawing.id = id;
    cache.drawing.path = drawingDir + id + '.json';

    res.locals.cache = cache;
    next();
  });
});

// find out if the user & drawing files exist
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: existence');
  var cache = res.locals.cache;

  cache.user.exists = fs.existsSync(cache.user.path);
  cache.drawing.exists = fs.existsSync(cache.drawing.path);

  res.locals.cache = cache;
  next();
});

// retrieve or set up the user data
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: user data');
  var cache = res.locals.cache;

  // if the user file exists, read it, otherwise just use template
  // note: don't write a new file if a new drawing is being created,
  // as the user file will be created in a subsequent middleware function
  if (cache.user.exists) {
    fs.readFile(cache.user.path, 'utf8', function(err, json) {
      if (err) { console.log('[Error]: Unable to read user file', err); return res.send(500); }
      cache.user.data = JSON.parse(json);
      res.locals.cache = cache;
      next();
    });
  } else {
    cache.user.data = helpers.templates.user;
    if (cache.drawing.create) {
      res.locals.cache = cache;
      next();
    } else {
      fs.writeFile(cache.user.path, JSON.stringify(cache.user.data), function(err) {
        if (err) { console.log('[Error]: Unable to write user file', err); return res.send(500); }
        cache.user.exists = true;
        res.locals.cache = cache;
        next();
      });
    }
  }
});

// retrieve or set up the drawing data
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: drawing data');
  var cache = res.locals.cache;

  // if the drawing file exists, read it, otherwise just use template
  // note: drawings are only created as a result of hitting the root
  if (cache.drawing.exists) {
    fs.readFile(cache.drawing.path, 'utf8', function(err, json) {
      if (err) { console.log('[Error]: Unable to read drawing file', err); return res.send(500); }
      cache.drawing.data = JSON.parse(json);
      res.locals.cache = cache;
      next();
    });
  } else {
    if (!cache.drawing.create) { return res.send(404); }

    cache.drawing.data = helpers.templates.drawing;
    fs.writeFile(cache.drawing.path, JSON.stringify(cache.drawing.data), function(err) {
      if (err) { console.log('[Error]: Unable to write drawing file', err); res.send(500); }
      cache.drawing.exists = true;
      res.locals.cache = cache;
      next();
    });
  }
});

// add this drawing to the user's collection, if need be
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: ownership');
  var cache = res.locals.cache;

  if (cache.drawing.create && cache.drawing.exists) {
    cache.user.data.push(cache.drawing.id);
    fs.writeFile(cache.user.path, JSON.stringify(cache.user.data), function(err) {
      if (err) { console.log('[Error]: Unable to write user file', err); return res.send(500); }
      cache.user.exists = true;
      res.locals.cache = cache;
      next();
    });
  } else {
    next();
  }
});

// find out if this user is the owner of the drawing
middleware.push(function(req, res, next) {
  dev && console.log('[Middleware]: Setup: ownership');
  var cache = res.locals.cache;

  cache.user.owner = _.include(cache.user.data, cache.drawing.id);

  res.locals.cache = cache;
  next();
});

// PATCH - updates a drawing. middleware?
// /clone - copies a drawing. middleware?

// =======
// Routing
// =======

// quickdraw.io/
// sets up and redirects to a new drawing
app.get('/', middleware, function(req, res) {
  dev && console.log('[Route]: GET /');
  var cache = res.locals.cache;

  res.redirect(307, '/' + cache.drawing.id)
});

// quickdraw.io/:id
// loads an existing drawing
app.get(/^\/([a-zA-Z0-9]{7})$/, middleware, function(req, res) {
  dev && console.log('[Route]: GET /:id');
  var cache = res.locals.cache;

  res.locals.initial = JSON.stringify(cache.drawing.data.paths);
  res.locals.owner = JSON.stringify(cache.user.owner);
  res.render('index');
});

// quickdraw.io/:id
// adds or removes a new path
app.patch(/^\/([a-zA-Z0-9]{7})$/, middleware, function(req, res) {
  dev && console.log('[Route]: PATCH /:id');
  var path = req.body.path;
  var cache = res.locals.cache;
  cache.drawing.data.paths.push(path);
  fs.writeFile(cache.drawing.path, JSON.stringify(cache.drawing.data), function(err) {
    if (err) { console.log('[Error]: Unable to write drawing file', err); res.send(500); }
    cache.drawing.exists = true;
    res.locals.cache = cache;
    res.send(200);
  });
});

// quickdraw.io/:id/clone
// clones a drawing
app.get(/^\/([a-zA-Z0-9]{7})\/clone$/, middleware, function(req, res) {
  dev && console.log('[Route]: GET /:id/clone');
  var cache = res.locals.cache;
  res.send(200);
});

// ======
// Listen
// ======

var port = process.env.app_port || process.env.NODE_PORT || process.env.PORT || 5000; app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);