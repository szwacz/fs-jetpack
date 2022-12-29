import { rmSync } from "fs";
import { rm } from "fs/promises";

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

export const removeSync = (path: string) => {
  rmSync(path, {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
};

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

export const removeAsync = (path: string) => {
  return rm(path, {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
};
