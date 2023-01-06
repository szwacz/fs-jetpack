import { statSync } from "fs";
import { stat } from "fs/promises";

export const existsFileSync = (path: string) => {
  try {
    const st = statSync(path);
    if (st.isFile()) {
      return true;
    }
    throw new Error(`Path ${path} exists but is not a file`);
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    } else {
      throw err;
    }
  }
};

export const existsFileAsync = (path: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    stat(path)
      .then((st) => {
        if (st.isFile()) {
          resolve(true);
        } else {
          reject(new Error(`Path ${path} exists but is not a file`));
        }
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          resolve(false);
        } else {
          reject(err);
        }
      });
  });
};
