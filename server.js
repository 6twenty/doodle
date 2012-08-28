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

// parse cookie data (returns an object)
function parseCookie(string) {
  var obj = {}, pairs = string ? string.split('_') : [];
  _.each(pairs, function(pair) {
    var split = pair.split('-');
    obj[split[0]] = split[1];
  });
  return obj;
}

// serialize cookie data (returns a string)
function serializeCookie(object) {
  var arr = [];
  _.forOwn(object, function(val, key) {
    arr.push([ key, val ].join('-')); 
  });
  return arr.join('_');
}

// =======
// Routing
// =======

// root path:
// sets up and redirects to new drawings
app.get('/', function(req, res) {
  console.log('GET /');

  var ids = [], id, code, codePair = {};

  // ensure the drawings directory exists
  if (!fs.existsSync(drawDir)) {
    fs.mkdirSync(drawDir);
  }

  // in order to proceed, we'll need a list of all
  // currently stored drawing ids, which we can obtain
  // by reading the file names in the drawings directory
  var files = fs.readdirSync(drawDir);

  // get all drawing ids
  _.each(files, function(file) {
    // ignore non-json files
    (/\.json$/).test(file) && ids.push(file.replace('.json', ''));
  });

  // creates a new unique id
  function generateId() {
    id = rs.generate(7).toLowerCase();
    // ensure it's unique
    if (_.include(ids, id)) {
      return generateId();
    } else {
      return id;
    }
  }

  // set an id and code for this drawing
  id   = generateId();   // unique
  code = rs.generate(7); // random
  codePair[id] = code;

  // build the cookie data
  var _qd_ = parseCookie(req.cookies._qd_);
  _.extend(_qd_, codePair);

  // create a json file for this drawing
  var jsonTemplate = '{ "code": "' + code + '", "paths": [] }';
  fs.writeFile(drawDir + id + '.json', jsonTemplate, function(err) {
    if (err) { console.log('Error generating JSON file', err); return res.send(500); };

    // set the cookie
    res.cookie('_qd_', serializeCookie(_qd_), {
      expires: new Date(Date.now() + (3600 * 1000 * 24 * 365 * 10))
    });

    // at last: redirect to the drawing
    res.redirect(307, '/' + id);
  });
});

// drawing path:
// loads up an existing drawing or redirects to root
app.get(/^\/([a-zA-Z0-9]{7})$/, function(req, res) {
  var id = req.params[0];
  console.log('GET /' + id);

  var filePath = drawDir + id + '.json';

  // bounce if the drawing file doesn't exist;
  // otherwise, render the view
  if (!fs.existsSync(filePath)) {
    console.log("Couldn't find drawing " + filepath);
    res.send(404); // TODO: this should return an actual 404 page
  } else {
    fs.readFile(filePath, 'utf8', function(err, json) {
      if (err) { console.log('Error reading drawing file', err); return res.send(500); };
      res.locals.initial = JSON.stringify(JSON.parse(json).paths, null, 2).replace(/\n/g, "\n      ");
      res.render('index');
    });
  }
});

// add or remove a new path
app.patch(/^\/([a-zA-Z0-9]{7})$/, function(req, res) {
  var id = req.params[0];
  console.log('PATCH /' + id);

  var filePath = drawDir + id + '.json';

  // return 404 if the drawing file doesn't exist;
  // otherwise proceed to authenticate and process the request
  if (!fs.existsSync(filePath)) {
    console.log("Cannot find drawing " + filePath);
    res.send(404);
  } else {
    fs.readFile(filePath, 'utf8', function(err, json) {
      if (err) { console.log('Error reading drawing file', err); return res.send(500); };
      json = JSON.parse(json);

      // compare the drawing code to the client's cookie
      // return 403 for mis-match
      var drawingCode = json.code,
          clientCode  = parseCookie(req.cookies._qd_)[id];

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
        fs.writeFile(filePath, JSON.stringify(json), function(err) {
          if (err) { console.log('Error saving JSON file', err); };
          res.send(err ? 500 : 200);
        });
      }
    });
  }
});

// ======
// Listen
// ======

var port = process.env.app_port || process.env.NODE_PORT || process.env.PORT || 5000; app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);
