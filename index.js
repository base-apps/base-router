var through     = require('through2');
var gutil       = require('gulp-util');
var fm          = require('front-matter');
var PluginError = gutil.PluginError;
var path        = require('path');
var fs          = require('fs');
var extend      = require('util')._extend;

module.exports = function(options) {
  var routes = [];

  options = extend({
    dir: process.cwd(),
    output: path.join(process.cwd(), 'routes.js'),
    mode: 'angular'
  }, options);

  function bufferContents(file, enc, cb) {
    var config;
    var content;

    if (file.isNull()) {
      cb(null, file);
    }

    if (file.isBuffer()) {
      try {
        content = fm(file.contents.toString());
      }
      catch (e) {
        return cb(new PluginError('Front Router', e));
      }

      if (content.attributes.name) {
        file.contents = new Buffer(content.body);
        config = content.attributes;
        var relativePath = path.relative(options.dir + path.sep + options.root, file.path);
        config.path = relativePath.split(path.sep).join('/');
        routes.push(config);
      }
    }

    cb(null, file);
  }

  function endStream(cb) {
    routes.sort(function(a, b) {
      return a.url < b.url;
    });

    var content = "angular.module('foundation.dynamicRouting').config(" +
      "['$FoundationStateProvider', function(FoundationStateProvider)" +
      "{ FoundationStateProvider.registerDynamicRoutes(" + JSON.stringify(routes) + "); }]); \n";

    // Create file with routes
    fs.writeFile(options.path, content, function(err) {
      if(err) throw err;
      cb();
    });
  }

  return through.obj(bufferContents, endStream);
};
