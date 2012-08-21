// ================
// preinitialize.js
// ================
// 
// Handles the preinitialization of the app,
// displays a loading indicator, and begins
// fetching the app's javascript assets.

;(function() {

  // Cache this drawing's id
  qd.id = location.pathname.replace(/\//g, '')

  // Loading spinner functions
  qd.loader = {
    // Initialize
    _spinner: new Spinner({
      lines     : 10,     // The number of lines to draw
      length    : 10,     // The length of each line
      width     : 15,     // The line thickness
      radius    : 25,     // The radius of the inner circle
      color     : '#aaa', // #rgb or #rrggbb
      speed     : 1,      // Rounds per second
      trail     : 60,     // Afterglow percentage
    }),

    // Show
    show: function() {
      document.getElementById('loading').style.display = 'block';
      qd.loader._spinner.spin(document.getElementById('loading'));
    },

    // Hide
    hide: function() {
      qd.loader._spinner.stop();
      document.getElementById('loading').style.display = 'none';
    }
  }

  // Show the loading spinner while the rest of the app loads
  window.onload = qd.loader.show;

  // load javascript assets individually in development;
  // load a concatenated & minified file in production
  var assets = [ '/js/app.min.js' ];
  if (qd._env != 'production') {
    assets = [
      // libs
      '/js/libs/paper.custom.min.js',
      '/js/libs/jquery.cookie.min.js',
      '/js/libs/jquery.mousewheel.min.js',
      '/js/libs/keymaster.min.js',
      '/js/libs/shake.min.js',
      // app
      '/js/app/namespaces.js',
      '/js/app/options.js',
      '/js/app/defaults.js',
      '/js/app/initial.js',
      '/js/app/getters-setters.js',
      '/js/app/utility.js',
      '/js/app/collection.js',
      '/js/app/path.js',
      '/js/app/events-drag.js',
      '/js/app/events-draw.js',
      '/js/app/events-ui.js',
      '/js/app/server.js',
      '/js/app/page.js',
      '/js/app/shortcuts.js',
      '/js/app/ui-help.js',
      '/js/app/ui-pen.js',
      '/js/app/ui-colors.js',
      '/js/app/handlers.js'
    ]
  }

  yepnope.errorTimeout = 4000;

  // Fetch the assets and declare callbacks
  // `json3` is loaded only if window.JSON is unavailable
  // `json3`, `jquery`, `raphael`, and `lodash` are all pulled from CDN
  // when possible (with local fallbacks)
  // All other assets are minified and concatenated in production
  yepnope([{
    test: window.JSON,
    nope: {
      json : '//cdnjs.cloudflare.com/ajax/libs/json3/3.2.3/json3.min.js'
    },
    load: {
      jquery  : '//cdnjs.cloudflare.com/ajax/libs/jquery/1.8.0/jquery-1.8.0.min.js',
      raphael : '//cdnjs.cloudflare.com/ajax/libs/raphael/2.1.0/raphael-min.js',
      lodash  : '//cdnjs.cloudflare.com/ajax/libs/lodash.js/0.5.1/lodash.min.js'
    },
    callback: {
      json    : function() { !window.JSON && yepnope('/js/libs/fallbacks/json-3.2.2.min.js'); },
      jquery  : function() { !window.jQuery && yepnope('/js/libs/fallbacks/jquery-1.8.0.min.js'); },
      raphael : function() { !window.Raphael && yepnope('/js/libs/fallbacks/raphael-2.1.0.min.js'); },
      lodash  : function() { !window._ && yepnope('/js/libs/fallbacks/lodash-0.5.1.min.js'); },
    }
  }, {
    load: assets,
    complete: function() {
      $(qd.loader.hide);
    }
  }]);

})();