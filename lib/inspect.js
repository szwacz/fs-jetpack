"use strict";

const crypto = require("crypto");
const pathUtil = require("path");
const fs = require("./utils/fs");
const validate = require("./utils/validate");

const supportedChecksumAlgorithms = ["md5", "sha1", "sha256", "sha512"];

const symlinkOptions = ["report", "follow"];

const validateInput = (methodName, path, options) => {
  const methodSignature = `${methodName}(path, [options])`;
  validate.argument(methodSignature, "path", path, ["string"]);
  validate.options(methodSignature, "options", options, {
    checksum: ["string"],
    mode: ["boolean"],
    times: ["boolean"],
    absolutePath: ["boolean"],
    symlinks: ["string"],
  });

  if (
    options &&
    options.checksum !== undefined &&
    supportedChecksumAlgorithms.indexOf(options.checksum) === -1
  ) {
    throw new Error(
      `Argument "options.checksum" passed to ${methodSignature} must have one of values: ${supportedChecksumAlgorithms.join(
        ", "
      )}`
    );
  }

  if (
    options &&
    options.symlinks !== undefined &&
    symlinkOptions.indexOf(options.symlinks) === -1
  ) {
    throw new Error(
      `Argument "options.symlinks" passed to ${methodSignature} must have one of values: ${symlinkOptions.join(
        ", "
      )}`
    );
  }
};

const createInspectObj = (path, options, stat) => {
  const obj = {};

  obj.name = pathUtil.basename(path);

  if (stat.isFile()) {
    obj.type = "file";
    obj.size = stat.size;
  } else if (stat.isDirectory()) {
    obj.type = "dir";
  } else if (stat.isSymbolicLink()) {
    obj.type = "symlink";
  } else {
    obj.type = "other";
  }

  if (options.mode) {
    obj.mode = stat.mode;
  }

  if (options.times) {
    obj.accessTime = stat.atime;
    obj.modifyTime = stat.mtime;
    obj.changeTime = stat.ctime;
    obj.birthTime = stat.birthtime;
  }

  if (options.absolutePath) {
    obj.absolutePath = path;
  }

  return obj;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const fileChecksum = (path, algo) => {
  const hash = crypto.createHash(algo);
  const data = fs.readFileSync(path);
  hash.update(data);
  return hash.digest("hex");
};

const addExtraFieldsSync = (path, inspectObj, options) => {
  if (inspectObj.type === "file" && options.checksum) {
    inspectObj[options.checksum] = fileChecksum(path, options.checksum);
  } else if (inspectObj.type === "symlink") {
    inspectObj.pointsAt = fs.readlinkSync(path);
  }
};

const inspectSync = (path, options) => {
  let statOperation = fs.lstatSync;
  let stat;
  const opts = options || {};

  if (opts.symlinks === "follow") {
    statOperation = fs.statSync;
  }

  try {
    stat = statOperation(path);
  } catch (err) {
    // Detection if path exists
    if (err.code === "ENOENT") {
      // Doesn't exist. Return undefined instead of throwing.
      return undefined;
    }
    throw err;
  }

  const inspectObj = createInspectObj(path, opts, stat);
  addExtraFieldsSync(path, inspectObj, opts);

  return inspectObj;
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const fileChecksumAsync = (path, algo) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algo);
    const s = fs.createReadStream(path);
    s.on("data", (data) => {
      hash.update(data);
    });
    s.on("end", () => {
      resolve(hash.digest("hex"));
    });
    s.on("error", reject);
  });
};

const addExtraFieldsAsync = (path, inspectObj, options) => {
  if (inspectObj.type === "file" && options.checksum) {
    return fileChecksumAsync(path, options.checksum).then((checksum) => {
      inspectObj[options.checksum] = checksum;
      return inspectObj;
    });
  } else if (inspectObj.type === "symlink") {
    return fs.readlink(path).then((linkPath) => {
      inspectObj.pointsAt = linkPath;
      return inspectObj;
    });
  }
  return Promise.resolve(inspectObj);
};

const inspectAsync = (path, options) => {
  return new Promise((resolve, reject) => {
    let statOperation = fs.lstat;
    const opts = options || {};

    if (opts.symlinks === "follow") {
      statOperation = fs.stat;
    }

    statOperation(path)
      .then((stat) => {
        const inspectObj = createInspectObj(path, opts, stat);
        addExtraFieldsAsync(path, inspectObj, opts).then(resolve, reject);
      })
      .catch((err) => {
        // Detection if path exists
        if (err.code === "ENOENT") {
          // Doesn't exist. Return undefined instead of throwing.
          resolve(undefined);
        } else {
          reject(err);
        }
      });
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.supportedChecksumAlgorithms = supportedChecksumAlgorithms;
exports.symlinkOptions = symlinkOptions;
exports.validateInput = validateInput;
exports.sync = inspectSync;
exports.async = inspectAsync;
