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
      // libraries
      '/js/libs/lodash-0.4.2.min.js',
      '/js/libs/jquery-1.8.0.min.js',
      '/js/libs/raphael-2.1.0.min.js',
      '/js/libs/paper-0.22.custom.min.js',
      // plugins/tools
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

  // Fetch the assets and declare callbacks
  // `json3` is loaded if window.JSON is unavailable
  // TODO: fetch jQuery from Google's CDN, or locally if that fails
  yepnope({
    test: window.JSON,
    nope: '/js/libs/json3.min.js',
    load: assets,
    complete: function() {
      // hide the loading spinner once the app is fully initialized
      $(qd.loader.hide);
    }
  });

})();