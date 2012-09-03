var buildify = require('buildify');

// the preinitialize script
buildify(__dirname, { quiet: true })
  .changeDir('public/js/')
  .load('app/preinitialize.js')
  .uglify()
  .perform(function(content) { return ';' + content; })
  .save('preinitialize.min.js')
  .clear()
  .concat([ 'libs/spin-1.2.5.min.js', 'preinitialize.min.js' ])
  .save('preinitialize.min.js');

// the core app files, minus assets loaded from CDN
buildify(__dirname, { quiet: true }).changeDir('public/js/').concat([
  'app/namespaces.js',
  'app/options.js',
  'app/defaults.js',
  'app/initial.js',
  'app/getters-setters.js',
  'app/utility.js',
  'app/collection.js',
  'app/path.js',
  'app/events-drag.js',
  'app/events-draw.js',
  'app/events-zoom.js',
  'app/events-ui.js',
  'app/server.js',
  'app/page.js',
  'app/shortcuts.js',
  'app/ui-help.js',
  'app/ui-pen.js',
  'app/ui-colors.js',
  'app/handlers.js'
]).uglify().perform(function(content) {
  return ';' + content;
}).save('app.min.js').clear().concat([
  'libs/paper.custom.min.js',
  'libs/jquery.cookie.min.js',
  'libs/jquery.mousewheel.min.js',
  'libs/keymaster.min.js',
  'libs/shake.min.js',
  'app.min.js'
]).save('app.min.js');