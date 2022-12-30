import { resolve, dirname } from "path";
import {
  openSync,
  closeSync,
  writeFileSync,
  readdirSync,
  open,
  close,
} from "fs";
import { writeFile, readdir } from "fs/promises";
import { mkdirpSync, mkdirpAsync } from "./helpers/mkdirp";
import { removeSync, removeAsync } from "./remove";

export const emptyFileSync = (path: string) => {
  try {
    const fd = openSync(path, "w");
    closeSync(fd);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Parent directory doesn't exist, create it first.
      mkdirpSync(dirname(path));
      // Retry with the file.
      writeFileSync(path, "");
    } else {
      throw err;
    }
  }
};

export const emptyFileAsync = (path: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    open(path, "w", function (err, fd) {
      if (err) {
        if (err.code === "ENOENT") {
          // Parent directory doesn't exist, create it first.
          mkdirpAsync(dirname(path))
            .then(() => {
              // Retry with the file.
              return writeFile(path, "");
            })
            .then(resolve)
            .catch((err) => {
              reject(err);
            });
        } else {
          reject(err);
        }
      } else {
        close(fd, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  });
};

export const emptyDirSync = (path: string) => {
  try {
    const list = readdirSync(path);
    list.forEach((filename) => {
      removeSync(resolve(path, filename));
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      // Dir doesn't exist, so just create it and we're done.
      mkdirpSync(path);
    } else {
      throw err;
    }
  }
};

export const emptyDirAsync = (path: string): Promise<void> => {
  return new Promise<void>((resolvePromise, rejectPromise) => {
    readdir(path)
      .then((list) => {
        const doOne = (index: number) => {
          if (index === list.length) {
            resolvePromise();
          } else {
            const subPath = resolve(path, list[index]);
            removeAsync(subPath)
              .then(() => {
                doOne(index + 1);
              })
              .catch((err) => {
                rejectPromise(err);
              });
          }
        };

        doOne(0);
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          // Dir doesn't exist, so just create it and we're done.
          mkdirpAsync(path).then(resolvePromise, rejectPromise);
        } else {
          rejectPromise(err);
        }
      });
  });
};
