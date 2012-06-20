// =====
// Notes
// =====

// ==============
// Initialization
// ==============

var express   = require('express'),
    beardcomb = require('beardcomb'),
    rs        = require('randomstring'),
    path      = require('path'),
    fs        = require('fs'),
    _         = require('underscore'),
    app       = module.exports = express.createServer();

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

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.register('.html', beardcomb);
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'magneto' }));
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
// sets up new drawings
// redirects to /:id
app.get('/', function(req, res) {
  console.log('GET /');

  var ids = [], id, code;

  // in order to proceed, we'll need a list of all
  // currently stored drawing ids, which we can obtain
  // by reading the file names in the drawings directory
  fs.readdir('./drawings/', function(err, files) {
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

    // create a json file for this drawing
    var jsonTemplate = JSON.stringify({ code: code, paths: [] });
    fs.writeFile('./drawings/' + id + '.json', jsonTemplate, function(err) {
      if (err) {
        console.log('Error generating JSON file', err);
        return res.send('Unable to create file.', 500);
      };
    });

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

    // at last: redirect to the drawing
    res.redirect('/' + id, 307);
  });
});

// drawing path data:
// retrieves the json path data for an existing drawing
// intended for ajax requests to generate the initial drawing paths
app.get('/:id.json', function(req, res) {
  console.log('GET /' + req.params.id + '.json');

  var id       = req.params.id,
      filePath = './drawings/' + id + '.json';

  // send back the json drawing data or return nothing if
  // this is a new drawing or if the drawing isn't found
  if (!path.existsSync(filePath)) {
    res.send(204);
  } else {
    fs.readFile(filePath, 'utf-8', function(err, json) {
      if (err) { console.log(err); return res.send(500); };
      // return the json string or nothing if there is no path data
      json = JSON.parse(json);
      if (!json.paths.length) { res.send(204); } else { res.json(json.paths); }
    });
  }
});

// drawing path:
// loads up an existing drawing or redirects to root
app.get('/:id', function(req, res) {
  console.log('GET /' + req.params.id);

  var id       = req.params.id,
      filePath = './drawings/' + id + '.json';

  // bounce if the drawing file doesn't exist;
  // otherwise, render the view
  if (!path.existsSync(filePath)) {
    res.redirect('/', 307);
  } else {
    res.render('index', { layout: false });
  }
});

// add or remove a new path
app.patch('/:id', function(req, res) {
  console.log('PATCH', '/' + req.params.id);

  var id       = req.params.id,
      filePath = './drawings/' + id + '.json';

  // return 404 if the drawing file doesn't exist;
  // otherwise proceed to authenticate and process the request
  if (!path.existsSync(filePath)) {
    res.send(404);
  } else {
    fs.readFile(filePath, 'utf-8', function(err, json) {
      if (err) { console.log(err); return res.send(500); };
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

// Listen

var port = process.env.app_port || process.env.PORT || 3000; app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);
