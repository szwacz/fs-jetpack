"use strict";

const Readable = require("stream").Readable;
const pathUtil = require("path");
const inspect = require("../inspect");
const list = require("../list");

// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------

const walkSync = (path, options, callback, currentLevel) => {
  const item = inspect.sync(path, options.inspectOptions);

  if (options.maxLevelsDeep === undefined) {
    options.maxLevelsDeep = Infinity;
  }

  callback(path, item);
  if (item && item.type === "dir" && currentLevel < options.maxLevelsDeep) {
    list.sync(path).forEach(child => {
      walkSync(
        path + pathUtil.sep + child,
        options,
        callback,
        currentLevel + 1
      );
    });
  }
};

const initialWalkSync = (path, options, callback) => {
  walkSync(path, options, callback, 0);
};

// ---------------------------------------------------------
// STREAM
// ---------------------------------------------------------

const walkStream = (path, options) => {
  const rs = new Readable({ objectMode: true });
  let nextTreeNode = {
    path,
    parent: undefined,
    level: 0
  };
  let running = false;
  let readSome;

  const error = function(err) {
    rs.emit("error", err);
  };

  const findNextUnprocessedNode = node => {
    if (node.nextSibling) {
      return node.nextSibling;
    } else if (node.parent) {
      return findNextUnprocessedNode(node.parent);
    }
    return undefined;
  };

  const pushAndContinueMaybe = data => {
    const theyWantMore = rs.push(data);
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

  readSome = () => {
    const theNode = nextTreeNode;

    running = true;

    inspect
      .async(theNode.path, options.inspectOptions)
      .then(inspected => {
        theNode.inspected = inspected;
        if (
          inspected &&
          inspected.type === "dir" &&
          theNode.level < options.maxLevelsDeep
        ) {
          list
            .async(theNode.path)
            .then(childrenNames => {
              const children = childrenNames.map(name => {
                return {
                  name,
                  path: theNode.path + pathUtil.sep + name,
                  parent: theNode,
                  level: theNode.level + 1
                };
              });
              children.forEach((child, index) => {
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

  rs._read = function() {
    if (!running) {
      readSome();
    }
  };

  return rs;
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.sync = initialWalkSync;
exports.stream = walkStream;
