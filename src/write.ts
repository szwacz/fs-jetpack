import { dirname } from "path";
import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import { mkdirpSync, mkdirpAsync } from "./helpers/mkdirp";

export const writeToFileSync = (path: string, data: string | Buffer) => {
  try {
    writeFileSync(path, data);
  } catch (err) {
    if (err.code === "ENOENT") {
      // Parent directory doesn't exist
      mkdirpSync(dirname(path));
      writeFileSync(path, data);
    } else {
      throw err;
    }
  }
};

export const writeToFileAsync = (
  path: string,
  data: string | Buffer
): Promise<void> => {
  return new Promise((resolve, reject) => {
    writeFile(path, data)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          // Parent directory doesn't exist
          mkdirpAsync(dirname(path))
            .then(() => {
              return writeFile(path, data);
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
