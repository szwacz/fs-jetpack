// Adater module exposing all `fs` methods with promises instead of callbacks.

'use strict';

const fs = require('fs');
const promisify = require('./promisify');

const isCallbackMethod = (key) => {
  return [
    typeof fs[key] === 'function',
    !key.match(/Sync$/),
    !key.match(/^[A-Z]/),
    !key.match(/^create/),
    !key.match(/^(un)?watch/),
  ].every(Boolean);
};

const promisifiedExists = (path) => {
  return new Promise((resolve) => {
    fs.exists(path, (data) => {
      resolve(data);
    });
  });
};

const adaptMethod = (name) => {
  const original = fs[name];
  return promisify(original);
};

const adaptAllMethods = () => {
  const adapted = {};

  Object.keys(fs).forEach((key) => {
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
  });

  return adapted;
};

module.exports = adaptAllMethods();
