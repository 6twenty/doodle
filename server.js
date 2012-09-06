// ==============
// Initialization
// ==============

var _       = require('lodash'),
    express = require('express'),
    rs      = require('randomstring'),
    path    = require('path'),
    fs      = require('fs'),
    app     = express(),
    drawDir = __dirname + '/drawings/';

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

// =======
// Helpers
// =======

var helpers = {};
helpers.cookies = {};

// parse cookie data (returns an object)
helpers.cookies.parse = function(string) {
  var obj = {}, pairs = string ? string.split('_') : [];
  _.each(pairs, function(pair) {
    var split = pair.split('-');
    obj[split[0]] = split[1];
  });
  return obj;
}

// serialize cookie data (returns a string)
helpers.cookies.serialize = function(object) {
  var arr = [];
  _.forOwn(object, function(val, key) {
    arr.push([ key, val ].join('-')); 
  });
  return arr.join('_');
}

// generates a new random & unique code
helpers.codeGenerator = function(existing) {
  var id = rs.generate(7).toLowerCase();
  // ensure it's unique
  if (_.include(existing, id)) {
    return helpers.codeGenerator();
  } else {
    return id;
  }
}

// pulls the drawing ID from params and builds
// the path to the drawing's json file
helpers.getInfo = function(req, res, next) {
  var id = res.locals.id = req.params[0];
  res.locals.filePath = drawDir + id + '.json';
  next();
}

// sets up a new drawing
helpers.setup = function(req, res, next, paths) {
  if (!paths) { paths = []; }
  var ids = [], id, code, codePair = {};

  // in order to proceed, we'll need a list of all
  // currently stored drawing ids, which we can obtain
  // by reading the file names in the drawings directory
  var files = fs.readdirSync(drawDir);

  // get a list of existing ids
  _.each(files, function(file) {
    // ignore non-json files
    (/\.json$/).test(file) && ids.push(file.replace('.json', ''));
  });

  // set an id and code for this drawing
  id   = helpers.codeGenerator(ids); // unique
  code = rs.generate(7); // random
  codePair[id] = code;

  // build the cookie data
  var _qd_ = helpers.cookies.parse(req.cookies._qd_);
  _.extend(_qd_, codePair);

  // create a json file for this drawing
  var jsonTemplate = '{ "code": "' + code + '", "paths": ' + JSON.stringify(paths) + ' }';
  fs.writeFile(drawDir + id + '.json', jsonTemplate, function(err) {
    if (err) { console.log('Error generating JSON file', err); return next(500); };

    // set the cookie
    res.cookie('_qd_', helpers.cookies.serialize(_qd_), {
      expires: new Date(Date.now() + (3600 * 1000 * 24 * 365 * 10))
    });

    // finish up
    next(null, id);
  });
}

// get an existing drawing
helpers.retrieve = function(req, res, next) {
  var id = req.params[0], filePath = drawDir + id + '.json';

  // make sure the drawing file exists
  if (!fs.existsSync(filePath)) {
    console.log("Couldn't find drawing " + filepath);
    next(404);
  } else {
    fs.readFile(filePath, 'utf8', function(err, json) {
      if (err) { console.log('Error reading drawing file', err); return next(500); };
      next(null, JSON.parse(json));
    });
  }
}

// =======
// Routing
// =======

// sets up and redirects to new drawings
app.get('/', function(req, res) {
  console.log('GET /');

  helpers.setup(req, res, function(err, id) {
    if (err) {
      res.send(err);
    } else {
      res.redirect(307, '/' + id);
    }
  })
});

// load up an existing drawing
app.get(/^\/([a-zA-Z0-9]{7})$/, helpers.getInfo, function(req, res) {
  console.log('GET /' + res.locals.id);

  helpers.retrieve(req, res, function(err, json) {
    if (err) { res.send(err); }
    res.locals.initial = JSON.stringify(json.paths, null, 2).replace(/\n/g, "\n      ");
    res.render('index');
  });
});

// add or remove a new path
app.patch(/^\/([a-zA-Z0-9]{7})$/, helpers.getInfo, function(req, res) {
  console.log('PATCH /' + res.locals.id);

  helpers.retrieve(req, res, function(err, json) {
    if (err) { res.send(err); }

    // compare the drawing code to the client's cookie
    // return 403 for mis-match
    var drawingCode = json.code,
        clientCode  = helpers.cookies.parse(req.cookies._qd_)[res.locals.id];

    if (drawingCode != clientCode) {
      console.log('Code pair mis-match');
      res.send(403); // forbidden
    } else {
      // this route accepts path additions as well as
      // deletions, which are identified by the _delete param
      if (req.body._delete == '1') {
        json.paths.pop();
      } else {
        json.paths.push(JSON.parse(req.body.path));
      }

      // write the changes back
      fs.writeFile(res.locals.filePath, JSON.stringify(json), function(err) {
        if (err) { console.log('Error saving JSON file', err); };
        res.send(err ? 500 : 200);
      });
    }
  });
});

// clone a drawing
app.get(/^\/([a-zA-Z0-9]{7})\/clone$/, helpers.getInfo, function(req, res) {
  console.log('GET /' + res.locals.id);

  helpers.retrieve(req, res, function(err, json) {
    if (err) { res.send(err); }

    helpers.setup(req, res, function(err, id) {
      err ? res.send(err) : res.redirect(307, '/' + id);
    }, json.paths);
  });
});

// ======
// Listen
// ======

var port = process.env.app_port || process.env.NODE_PORT || process.env.PORT || 5000; app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);
