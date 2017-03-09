'use strict';

var fs = require('fs');
var promisify = require('./promisify');

var isCallbackMethod = function (key) {
  return [
    typeof fs[key] === 'function',
    !key.match(/Sync$/),
    !key.match(/^[A-Z]/),
    !key.match(/^create/),
    !key.match(/^(un)?watch/)
  ].every(Boolean);
};

var promisifiedExists = function (path) {
  return new Promise(function (resolve, reject) {
    fs.exists(path, function (data) {
      resolve(data);
    });
  });
};

var adaptMethod = function (name) {
  var original = fs[name];
  return promisify(original);
};

var adaptAllMethods = function () {
  var adapted = {};

  for (var key in fs) {
    if (!fs.hasOwnProperty(key)) continue;

    if (isCallbackMethod(key)) {
      if (key === 'exists') {
        // fs.exists() does not follow standard
        // Node callback conventions, and has
        // no error object in the callback
        adapted.exists = promisifiedExists;
      } else {
        adapted[key] = adaptMethod(key);
      }
    } else {
      adapted[key] = fs[key];
    }
  }

  return adapted;
};

module.exports = adaptAllMethods();
