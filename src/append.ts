import { dirname } from "path";
import { appendFileSync } from "fs";
import { appendFile } from "fs/promises";
import { mkdirpSync, mkdirpAsync } from "./helpers/mkdirp";

export const appendToFileSync = (path: string, data: string | Buffer) => {
  try {
    appendFileSync(path, data);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Parent directory doesn't exist
      mkdirpSync(dirname(path));
      appendFileSync(path, data);
    } else {
      throw err;
    }
  }
};

export const appendToFileAsync = (
  path: string,
  data: string | Buffer
): Promise<void> => {
  return new Promise((resolve, reject) => {
    appendFile(path, data)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          // Parent directory doesn't exist
          mkdirpAsync(dirname(path))
            .then(() => {
              return appendFile(path, data);
            })
            .then(() => {
              resolve();
            })
            .catch(reject);
        } else {
          reject(err);
        }
      });
  });
};
