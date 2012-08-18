var buildify = require('buildify');

buildify().changeDir('public/js/app/').concat([
  'namespaces.js',
  'options.js',
  'defaults.js',
  'initial.js',
  'getters-setters.js',
  'utility.js',
  'path.js',
  'events-drag.js',
  'events-draw.js',
  'events-ui.js',
  'server.js',
  'page.js',
  'shortcuts.js',
  'ui-help.js',
  'ui-pen.js',
  'ui-colors.js',
  'handlers.js'
]).uglify().perform(function(content) {
  return ';' + content;
}).changeDir('../').save('app.min.js').clear().changeDir('libs/').concat([
  'lodash-0.4.2.min.js',
  'jquery-1.8.0.min.js',
  'raphael-2.1.0.min.js',
  'paper-0.22.custom.min.js',
  'jquery.cookie.min.js',
  'jquery.mousewheel.min.js',
  'keymaster.min.js',
  'shake.min.js',
  '../app.min.js'
]).changeDir('../').save('app.min.js');