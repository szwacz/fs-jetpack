import { dirname } from "path";
import { mkdirSync } from "fs";
import { mkdir } from "fs/promises";

export const mkdirpSync = (path: string) => {
  try {
    mkdirSync(path);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Parent directory doesn't exist. Need to create it first.
      mkdirpSync(dirname(path));
      // Now retry creating this directory.
      mkdirSync(path);
    } else if (err.code === "EEXIST") {
      // The path already exists. We're fine.
    } else {
      throw err;
    }
  }
};

export const mkdirpAsync = (path: string) => {
  return new Promise<void>((resolve, reject) => {
    mkdir(path)
      .then(resolve)
      .catch((err) => {
        if (err.code === "ENOENT") {
          // Parent directory doesn't exist. Need to create it first.
          mkdirpAsync(dirname(path))
            .then(() => {
              // Now retry creating this directory.
              return mkdir(path);
            })
            .then(resolve)
            .catch((err2) => {
              if (err2.code === "EEXIST") {
                // Hmm, something other have already created the directory?
                // No problem for us.
                resolve();
              } else {
                reject(err2);
              }
            });
        } else if (err.code === "EEXIST") {
          // The path already exists. We're fine.
          resolve();
        } else {
          reject(err);
        }
      });
  });
};
