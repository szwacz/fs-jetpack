import { inspect } from "util";
import { resolve } from "path";
import { appendToFileSync, appendToFileAsync } from "./append";
import { emptyFileSync, emptyFileAsync } from "./empty";
import { existsFileSync, existsFileAsync } from "./exists";
import { removeSync, removeAsync } from "./remove";

export interface File {
  path(): string;
  append(data: string | Buffer): void;
  appendAsync(data: string | Buffer): Promise<void>;
  empty(): void;
  emptyAsync(): Promise<void>;
  exists(): boolean;
  existsAsync(): Promise<boolean>;
  remove(): void;
  removeAsync(): Promise<void>;
  toString(): string;
}

export const constructFile = (filePath: string): File => {
  const path = () => {
    return filePath;
  };

  const toString = () => {
    return `[fs-jetpack file ${path()}]`;
  };

  return {
    path,
    append: (data: string | Buffer) => {
      const isDataValid = typeof data === "string" || Buffer.isBuffer(data);
      if (isDataValid === false) {
        throw new Error(
          `Method "file.append()" received invalid data parameter`
        );
      }
      appendToFileSync(path(), data);
    },
    appendAsync: (data: string | Buffer): Promise<void> => {
      const isDataValid = typeof data === "string" || Buffer.isBuffer(data);
      if (isDataValid === false) {
        throw new Error(
          `Method "file.appendAsync()" received invalid data parameter`
        );
      }
      return appendToFileAsync(path(), data);
    },
    empty: () => {
      emptyFileSync(path());
    },
    emptyAsync: (): Promise<void> => {
      return emptyFileAsync(path());
    },
    exists: (): boolean => {
      return existsFileSync(path());
    },
    existsAsync: (): Promise<boolean> => {
      return existsFileAsync(path());
    },
    remove: () => {
      removeSync(path());
    },
    removeAsync: (): Promise<void> => {
      return removeAsync(path());
    },
    toString,
    // @ts-ignore
    [inspect.custom]: toString,
  };
};
