'use strict';

const pathUtil = require('path');
const fs = require('./utils/fs');
const dir = require('./dir');
const exists = require('./exists');
const matcher = require('./utils/matcher');
const fileMode = require('./utils/mode');
const treeWalker = require('./utils/tree_walker');
const validate = require('./utils/validate');
const write = require('./write');

const validateInput = (methodName, from, to, options) => {
  const methodSignature = `${methodName}(from, to, [options])`;
  validate.argument(methodSignature, 'from', from, ['string']);
  validate.argument(methodSignature, 'to', to, ['string']);
  validate.options(methodSignature, 'options', options, {
    overwrite: ['boolean'],
    matching: ['string', 'array of string'],
  });
};

const parseOptions = (options, from) => {
  const opts = options || {};
  const parsedOptions = {};

  parsedOptions.overwrite = opts.overwrite;

  if (opts.matching) {
    parsedOptions.allowedToCopy = matcher.create(from, opts.matching);
  } else {
    parsedOptions.allowedToCopy = () => {
      // Default behaviour - copy everything.
      return true;
    };
  }

  return parsedOptions;
};

const generateNoSourceError = (path) => {
  const err = new Error(`Path to copy doesn't exist ${path}`);
  err.code = 'ENOENT';
  return err;
};

const generateDestinationExistsError = (path) => {
  const err = new Error(`Destination path already exists ${path}`);
  err.code = 'EEXIST';
  return err;
};

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

const checksBeforeCopyingSync = (from, to, opts) => {
  if (!exists.sync(from)) {
    throw generateNoSourceError(from);
  }

  if (exists.sync(to) && !opts.overwrite) {
    throw generateDestinationExistsError(to);
  }
};

const copyFileSync = (from, to, mode) => {
  const data = fs.readFileSync(from);
  write.sync(to, data, { mode });
};

const copySymlinkSync = (from, to) => {
  const symlinkPointsAt = fs.readlinkSync(from);
  try {
    fs.symlinkSync(symlinkPointsAt, to);
  } catch (err) {
    // There is already file/symlink with this name on destination location.
    // Must erase it manually, otherwise system won't allow us to place symlink there.
    if (err.code === 'EEXIST') {
      fs.unlinkSync(to);
      // Retry...
      fs.symlinkSync(symlinkPointsAt, to);
    } else {
      throw err;
    }
  }
};

const copyItemSync = (from, inspectData, to) => {
  const mode = fileMode.normalizeFileMode(inspectData.mode);
  if (inspectData.type === 'dir') {
    dir.createSync(to, { mode });
  } else if (inspectData.type === 'file') {
    copyFileSync(from, to, mode);
  } else if (inspectData.type === 'symlink') {
    copySymlinkSync(from, to);
  }
};

const copySync = (from, to, options) => {
  const opts = parseOptions(options, from);

  checksBeforeCopyingSync(from, to, opts);

  treeWalker.sync(from, {
    inspectOptions: {
      mode: true,
      symlinks: true,
    },
  }, (path, inspectData) => {
    const rel = pathUtil.relative(from, path);
    const destPath = pathUtil.resolve(to, rel);
    if (opts.allowedToCopy(path)) {
      copyItemSync(path, inspectData, destPath);
    }
  });
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const checksBeforeCopyingAsync = (from, to, opts) => {
  return exists.async(from)
  .then((srcPathExists) => {
    if (!srcPathExists) {
      throw generateNoSourceError(from);
    } else {
      return exists.async(to);
    }
  })
  .then((destPathExists) => {
    if (destPathExists && !opts.overwrite) {
      throw generateDestinationExistsError(to);
    }
  });
};

const copyFileAsync = (from, to, mode, retriedAttempt) => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(from);
    const writeStream = fs.createWriteStream(to, { mode });

    readStream.on('error', reject);

    writeStream.on('error', (err) => {
      const toDirPath = pathUtil.dirname(to);

      // Force read stream to close, since write stream errored
      // read stream serves us no purpose.
      readStream.resume();

      if (err.code === 'ENOENT' && retriedAttempt === undefined) {
        // Some parent directory doesn't exits. Create it and retry.
        dir.createAsync(toDirPath)
        .then(() => {
          // Make retry attempt only once to prevent vicious infinite loop
          // (when for some obscure reason I/O will keep returning ENOENT error).
          // Passing retriedAttempt = true.
          copyFileAsync(from, to, mode, true)
          .then(resolve, reject);
        })
        .catch(reject);
      } else {
        reject(err);
      }
    });

    writeStream.on('finish', resolve);

    readStream.pipe(writeStream);
  });
};

const copySymlinkAsync = (from, to) => {
  return fs.readlink(from)
  .then((symlinkPointsAt) => {
    return new Promise((resolve, reject) => {
      fs.symlink(symlinkPointsAt, to)
      .then(resolve)
      .catch((err) => {
        if (err.code === 'EEXIST') {
          // There is already file/symlink with this name on destination location.
          // Must erase it manually, otherwise system won't allow us to place symlink there.
          fs.unlink(to)
          .then(() => {
            // Retry...
            return fs.symlink(symlinkPointsAt, to);
          })
          .then(resolve, reject);
        } else {
          reject(err);
        }
      });
    });
  });
};

const copyItemAsync = (from, inspectData, to) => {
  const mode = fileMode.normalizeFileMode(inspectData.mode);
  if (inspectData.type === 'dir') {
    return dir.createAsync(to, { mode });
  } else if (inspectData.type === 'file') {
    return copyFileAsync(from, to, mode);
  } else if (inspectData.type === 'symlink') {
    return copySymlinkAsync(from, to);
  }
  // Ha! This is none of supported file system entities. What now?
  // Just continuing without actually copying sounds sane.
  return Promise.resolve();
};

const copyAsync = (from, to, options) => {
  return new Promise((resolve, reject) => {
    const opts = parseOptions(options, from);

    checksBeforeCopyingAsync(from, to, opts)
    .then(() => {
      let allFilesDelivered = false;
      let filesInProgress = 0;

      const stream = treeWalker.stream(from, {
        inspectOptions: {
          mode: true,
          symlinks: true,
        },
      })
      .on('readable', () => {
        const item = stream.read();
        let rel;
        let destPath;
        if (item) {
          rel = pathUtil.relative(from, item.path);
          destPath = pathUtil.resolve(to, rel);
          if (opts.allowedToCopy(item.path)) {
            filesInProgress += 1;
            copyItemAsync(item.path, item.item, destPath)
            .then(() => {
              filesInProgress -= 1;
              if (allFilesDelivered && filesInProgress === 0) {
                resolve();
              }
            })
            .catch(reject);
          }
        }
      })
      .on('error', reject)
      .on('end', () => {
        allFilesDelivered = true;
        if (allFilesDelivered && filesInProgress === 0) {
          resolve();
        }
      });
    })
    .catch(reject);
  });
};

// ---------------------------------------------------------
// API
// ---------------------------------------------------------

exports.validateInput = validateInput;
exports.sync = copySync;
exports.async = copyAsync;
