"use strict";

const util = require("util");
const pathUtil = require("path");
const append = require("./append");
const dir = require("./dir");
const file = require("./file");
const find = require("./find");
const inspect = require("./inspect");
const inspectTree = require("./inspect_tree");
const copy = require("./copy");
const exists = require("./exists");
const list = require("./list");
const move = require("./move");
const read = require("./read");
const remove = require("./remove");
const rename = require("./rename");
const symlink = require("./symlink");
const streams = require("./streams");
const tmpDir = require("./tmp_dir");
const write = require("./write");

// The Jetpack Context object.
// It provides the public API, and resolves all paths regarding to
// passed cwdPath, or default process.cwd() if cwdPath was not specified.
const jetpackContext = cwdPath => {
  const getCwdPath = () => {
    return cwdPath || process.cwd();
  };

  const cwd = function() {
    // return current CWD if no arguments specified...
    if (arguments.length === 0) {
      return getCwdPath();
    }

    // ...create new CWD context otherwise
    const args = Array.prototype.slice.call(arguments);
    const pathParts = [getCwdPath()].concat(args);
    return jetpackContext(pathUtil.resolve.apply(null, pathParts));
  };

  // resolves path to inner CWD path of this jetpack instance
  const resolvePath = path => {
    return pathUtil.resolve(getCwdPath(), path);
  };

  const getPath = function() {
    // add CWD base path as first element of arguments array
    Array.prototype.unshift.call(arguments, getCwdPath());
    return pathUtil.resolve.apply(null, arguments);
  };

  const normalizeOptions = options => {
    const opts = options || {};
    opts.cwd = getCwdPath();
    return opts;
  };

  // API

  const api = {
    cwd,
    path: getPath,

    append: (path, data, options) => {
      append.validateInput("append", path, data, options);
      append.sync(resolvePath(path), data, options);
    },
    appendAsync: (path, data, options) => {
      append.validateInput("appendAsync", path, data, options);
      return append.async(resolvePath(path), data, options);
    },

    copy: (from, to, options) => {
      copy.validateInput("copy", from, to, options);
      copy.sync(resolvePath(from), resolvePath(to), options);
    },
    copyAsync: (from, to, options) => {
      copy.validateInput("copyAsync", from, to, options);
      return copy.async(resolvePath(from), resolvePath(to), options);
    },

    createWriteStream: (path, options) => {
      return streams.createWriteStream(resolvePath(path), options);
    },
    createReadStream: (path, options) => {
      return streams.createReadStream(resolvePath(path), options);
    },

    dir: (path, criteria) => {
      dir.validateInput("dir", path, criteria);
      const normalizedPath = resolvePath(path);
      dir.sync(normalizedPath, criteria);
      return cwd(normalizedPath);
    },
    dirAsync: (path, criteria) => {
      dir.validateInput("dirAsync", path, criteria);
      return new Promise((resolve, reject) => {
        const normalizedPath = resolvePath(path);
        dir.async(normalizedPath, criteria).then(() => {
          resolve(cwd(normalizedPath));
        }, reject);
      });
    },

    exists: path => {
      exists.validateInput("exists", path);
      return exists.sync(resolvePath(path));
    },
    existsAsync: path => {
      exists.validateInput("existsAsync", path);
      return exists.async(resolvePath(path));
    },

    file: (path, criteria) => {
      file.validateInput("file", path, criteria);
      file.sync(resolvePath(path), criteria);
      return api;
    },
    fileAsync: (path, criteria) => {
      file.validateInput("fileAsync", path, criteria);
      return new Promise((resolve, reject) => {
        file.async(resolvePath(path), criteria).then(() => {
          resolve(api);
        }, reject);
      });
    },

    find: (startPath, options) => {
      // startPath is optional parameter, if not specified move rest of params
      // to proper places and default startPath to CWD.
      if (typeof options === "undefined" && typeof startPath === "object") {
        options = startPath;
        startPath = ".";
      }
      find.validateInput("find", startPath, options);
      return find.sync(resolvePath(startPath), normalizeOptions(options));
    },
    findAsync: (startPath, options) => {
      // startPath is optional parameter, if not specified move rest of params
      // to proper places and default startPath to CWD.
      if (typeof options === "undefined" && typeof startPath === "object") {
        options = startPath;
        startPath = ".";
      }
      find.validateInput("findAsync", startPath, options);
      return find.async(resolvePath(startPath), normalizeOptions(options));
    },

    inspect: (path, fieldsToInclude) => {
      inspect.validateInput("inspect", path, fieldsToInclude);
      return inspect.sync(resolvePath(path), fieldsToInclude);
    },
    inspectAsync: (path, fieldsToInclude) => {
      inspect.validateInput("inspectAsync", path, fieldsToInclude);
      return inspect.async(resolvePath(path), fieldsToInclude);
    },

    inspectTree: (path, options) => {
      inspectTree.validateInput("inspectTree", path, options);
      return inspectTree.sync(resolvePath(path), options);
    },
    inspectTreeAsync: (path, options) => {
      inspectTree.validateInput("inspectTreeAsync", path, options);
      return inspectTree.async(resolvePath(path), options);
    },

    list: path => {
      list.validateInput("list", path);
      return list.sync(resolvePath(path || "."));
    },
    listAsync: path => {
      list.validateInput("listAsync", path);
      return list.async(resolvePath(path || "."));
    },

    move: (from, to, options) => {
      move.validateInput("move", from, to, options);
      move.sync(resolvePath(from), resolvePath(to), options);
    },
    moveAsync: (from, to, options) => {
      move.validateInput("moveAsync", from, to, options);
      return move.async(resolvePath(from), resolvePath(to), options);
    },

    read: (path, returnAs) => {
      read.validateInput("read", path, returnAs);
      return read.sync(resolvePath(path), returnAs);
    },
    readAsync: (path, returnAs) => {
      read.validateInput("readAsync", path, returnAs);
      return read.async(resolvePath(path), returnAs);
    },

    remove: path => {
      remove.validateInput("remove", path);
      // If path not specified defaults to CWD
      remove.sync(resolvePath(path || "."));
    },
    removeAsync: path => {
      remove.validateInput("removeAsync", path);
      // If path not specified defaults to CWD
      return remove.async(resolvePath(path || "."));
    },

    rename: (path, newName, options) => {
      rename.validateInput("rename", path, newName, options);
      rename.sync(resolvePath(path), newName, options);
    },
    renameAsync: (path, newName, options) => {
      rename.validateInput("renameAsync", path, newName, options);
      return rename.async(resolvePath(path), newName, options);
    },

    symlink: (symlinkValue, path) => {
      symlink.validateInput("symlink", symlinkValue, path);
      symlink.sync(symlinkValue, resolvePath(path));
    },
    symlinkAsync: (symlinkValue, path) => {
      symlink.validateInput("symlinkAsync", symlinkValue, path);
      return symlink.async(symlinkValue, resolvePath(path));
    },

    tmpDir: options => {
      tmpDir.validateInput("tmpDir", options);
      const pathOfCreatedDirectory = tmpDir.sync(getCwdPath(), options);
      return cwd(pathOfCreatedDirectory);
    },
    tmpDirAsync: options => {
      tmpDir.validateInput("tmpDirAsync", options);
      return new Promise((resolve, reject) => {
        tmpDir.async(getCwdPath(), options).then(pathOfCreatedDirectory => {
          resolve(cwd(pathOfCreatedDirectory));
        }, reject);
      });
    },

    write: (path, data, options) => {
      write.validateInput("write", path, data, options);
      write.sync(resolvePath(path), data, options);
    },
    writeAsync: (path, data, options) => {
      write.validateInput("writeAsync", path, data, options);
      return write.async(resolvePath(path), data, options);
    }
  };

  if (util.inspect.custom !== undefined) {
    // Without this console.log(jetpack) throws obscure error. Details:
    // https://github.com/szwacz/fs-jetpack/issues/29
    // https://nodejs.org/api/util.html#util_custom_inspection_functions_on_objects
    api[util.inspect.custom] = () => {
      return `[fs-jetpack CWD: ${getCwdPath()}]`;
    };
  }

  return api;
};

module.exports = jetpackContext;
