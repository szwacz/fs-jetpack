/* eslint no-underscore-dangle:0 */

'use strict';

var Readable = require('stream').Readable;
var inspect = require('../inspect');
var list = require('../list');

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

var walkSync = function (path, callback) {
  var item = inspect.sync(path);
  callback(path, item);
  if (item.type === 'dir') {
    list.sync(path).forEach(function (child) {
      walkSync(path + '/' + child, callback);
    });
  }
};

// ---------------------------------------------------------
// STREAM
// ---------------------------------------------------------

var walkStream = function (path) {
  var rs = new Readable({ objectMode: true });
  var nextTreeNode = {
    path: path,
    parent: undefined
  };
  var running = false;
  var readSome;

  var error = function (err) {
    rs.emit('error', err);
  };

  var findNextUnprocessedNode = function (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    } else if (node.parent && node.parent.nextSibling) {
      return node.parent.nextSibling;
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

  readSome = function () {
    var theNode = nextTreeNode;

    running = true;

    inspect.async(theNode.path)
    .then(function (inspected) {
      theNode.inspected = inspected;
      if (inspected.type === 'dir') {
        list.async(theNode.path)
        .then(function (childrenNames) {
          var children = childrenNames.map(function (name) {
            return {
              name: name,
              path: theNode.path + '/' + name,
              parent: theNode
            };
          });
          children.forEach(function (child, index) {
            child.nextSibling = children[index + 1];
          });

          nextTreeNode = children[0];
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
