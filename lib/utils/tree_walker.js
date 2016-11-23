/* eslint no-underscore-dangle:0 */

'use strict';

var Readable = require('stream').Readable;
var pathUtil = require('path');
var inspect = require('../inspect');
var list = require('../list');

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

var walkSync = function (path, options, callback, currentLevel) {
  var item = inspect.sync(path, options.inspectOptions);

  if (options.maxLevelsDeep === undefined) {
    options.maxLevelsDeep = Infinity;
  }
  if (currentLevel === undefined) {
    currentLevel = 0;
  }

  callback(path, item);
  if (item && item.type === 'dir' && currentLevel < options.maxLevelsDeep) {
    list.sync(path).forEach(function (child) {
      walkSync(path + pathUtil.sep + child, options, callback, currentLevel + 1);
    });
  }
};

// ---------------------------------------------------------
// STREAM
// ---------------------------------------------------------

var walkStream = function (path, options) {
  var rs = new Readable({ objectMode: true });
  var nextTreeNode = {
    path: path,
    parent: undefined,
    level: 0
  };
  var running = false;
  var readSome;

  var error = function (err) {
    rs.emit('error', err);
  };

  var findNextUnprocessedNode = function (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    } else if (node.parent) {
      return findNextUnprocessedNode(node.parent);
    }
    return undefined;
  };

  var pushAndContinueMaybe = function (data) {
    var theyWantMore = rs.push(data);
    running = false;
    if (!nextTreeNode) {
      // Previous was the last node. The job is done.
      rs.push(null);
    } else if (theyWantMore) {
      readSome();
    }
  };

  if (options.maxLevelsDeep === undefined) {
    options.maxLevelsDeep = Infinity;
  }

  readSome = function () {
    var theNode = nextTreeNode;

    running = true;

    inspect.async(theNode.path, options.inspectOptions)
    .then(function (inspected) {
      theNode.inspected = inspected;
      if (inspected && inspected.type === 'dir' && theNode.level < options.maxLevelsDeep) {
        list.async(theNode.path)
        .then(function (childrenNames) {
          var children = childrenNames.map(function (name) {
            return {
              name: name,
              path: theNode.path + pathUtil.sep + name,
              parent: theNode,
              level: theNode.level + 1
            };
          });
          children.forEach(function (child, index) {
            child.nextSibling = children[index + 1];
          });

          nextTreeNode = children[0] || findNextUnprocessedNode(theNode);
          pushAndContinueMaybe({ path: theNode.path, item: inspected });
        })
        .catch(error);
      } else {
        nextTreeNode = findNextUnprocessedNode(theNode);
        pushAndContinueMaybe({ path: theNode.path, item: inspected });
      }
    })
    .catch(error);
  };

  rs._read = function () {
    if (!running) {
      readSome();
    }
  };

  return rs;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = walkSync;
exports.stream = walkStream;
