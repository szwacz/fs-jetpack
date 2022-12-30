import { rmSync } from "fs";
import { rm } from "fs/promises";

export const removeSync = (path: string) => {
  rmSync(path, {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
};

export const removeAsync = (path: string) => {
  return rm(path, {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
};
