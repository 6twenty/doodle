// =====
// Notes
// =====

// todo:
// - more comments
// - use redis session store for express
// - zooming
// - abstract the method for getting a drawing's
//   json file into a shared helper

// ==============
// Initialization
// ==============

var express = require('express'),
    rs      = require('randomstring'),
    path    = require('path'),
    fs      = require('fs'),
    _       = require('underscore'),
    app     = express();

// delete any empty drawings to minimise the number of json files
fs.readdir('./drawings/', function(err, files) {
  _.each(files, function(file) {
    if ((/\.json$/).test(file)) {
      fs.readFile('./drawings/' + file, 'utf-8', function(err, json) {
        if (!err && !JSON.parse(json).paths.length) {
          fs.unlink('./drawings/' + file);
        }
      });
    }
  });
});

// =============
// Configuration
// =============

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', function(path, options, fn) {
    fs.readFile(path, 'utf8', function(err, str) {
      if (err) { return fn(err); }
      fn(null, str.replace('{{{ initial }}}', options.locals.initial));
    });
  });
  app.use(express.bodyParser());
  app.use(express.cookieParser('magneto'));
  app.use(express.session());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
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
// Routing
// =======

// root path:
// sets up and redirects to new drawings
app.get('/', function(req, res) {
  console.log('GET /');

  var ids = [], id, code;

  // ensure the drawings directory exists
  if (!fs.existsSync('./drawings/')) {
    fs.mkdirSync('./drawings');
  }

  // in order to proceed, we'll need a list of all
  // currently stored drawing ids, which we can obtain
  // by reading the file names in the drawings directory
  fs.readdir('./drawings/', function(err, files) {
    if (err) { console.log('Error reading drawings directory', err); };

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

    // date 10 years from now (for cookies)
    var in10yrs = new Date(Date.now() + (3600 * 1000 * 24 * 365 * 10));

    // set a cookie marking the client as the drawing's owner (10-year expiry)
    // this tells the front-end app to allow editing
    res.cookie('qd_' + id, '1', {
      expires: in10yrs
    });

    // set a cookie containing the passcode (also 10-year expiry)
    // this tells the back-end app to allow updates
    res.cookie('qd_' + id + '_code', code, {
      expires: in10yrs,
      httpOnly: true
    });

    // create a json file for this drawing
    var jsonTemplate = JSON.stringify({ code: code, paths: [] });
    fs.writeFile('./drawings/' + id + '.json', jsonTemplate, function(err) {
      if (err) { console.log('Error generating JSON file', err); res.send(500); };

      // at last: redirect to the drawing
      res.redirect(307, '/' + id);
    });
  });
});

// drawing path:
// loads up an existing drawing or redirects to root
app.get('/:id', function(req, res) {
  console.log('GET /' + req.params.id);

  var id       = req.params.id,
      filePath = './drawings/' + id + '.json';

  // bounce if the drawing file doesn't exist;
  // otherwise, render the view
  if (!fs.existsSync(filePath)) {
    res.redirect(307, '/');
  } else {
    fs.readFile(filePath, 'utf8', function(err, json) {
      if (err) { console.log('Error reading drawing file', err); return res.send(500); };
      res.locals.initial = JSON.stringify(JSON.parse(json).paths, null, 2).replace(/\n/g, "\n      ");
      res.render('index');
    });
  }
});

// add or remove a new path
app.patch('/:id', function(req, res) {
  console.log('PATCH', '/' + req.params.id);

  var id       = req.params.id,
      filePath = './drawings/' + id + '.json';

  // return 404 if the drawing file doesn't exist;
  // otherwise proceed to authenticate and process the request
  if (!fs.existsSync(filePath)) {
    res.send(404);
  } else {
    fs.readFile(filePath, 'utf8', function(err, json) {
      if (err) { console.log('Error reading drawing file', err); return res.send(500); };
      json = JSON.parse(json);

      // compare the drawing code to the client's cookie
      // return 403 for mis-match
      var drawingCode = json.code,
          clientCode  = req.cookies['qd_' + id + '_code'];

      if (drawingCode != clientCode) {
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

var port = process.env.app_port || process.env.PORT || 3000; app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);
