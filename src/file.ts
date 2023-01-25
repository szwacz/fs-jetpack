import { inspect } from "util";
import { resolve } from "path";
import { appendToFileSync, appendToFileAsync } from "./append";
import { emptyFileSync, emptyFileAsync } from "./empty";
import { existsFileSync, existsFileAsync } from "./exists";
import { removeSync, removeAsync } from "./remove";
import { writeToFileSync, writeToFileAsync } from "./write";
import { isStringOrBuffer } from "./helpers/validators";

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
  write(data: string | Buffer): void;
  writeAsync(data: string | Buffer): Promise<void>;
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
      if (isStringOrBuffer(data) === false) {
        throw new Error(
          `Method "file.append()" received invalid data parameter`
        );
      }
      appendToFileSync(path(), data);
    },
    appendAsync: (data: string | Buffer): Promise<void> => {
      if (isStringOrBuffer(data) === false) {
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
    write: (data: string | Buffer) => {
      if (isStringOrBuffer(data) === false) {
        throw new Error(
          `Method "file.write()" received invalid data parameter`
        );
      }
      writeToFileSync(path(), data);
    },
    writeAsync: (data: string | Buffer): Promise<void> => {
      if (isStringOrBuffer(data) === false) {
        throw new Error(
          `Method "file.writeAsync()" received invalid data parameter`
        );
      }
      return writeToFileAsync(path(), data);
    },
    toString,
    // @ts-ignore
    [inspect.custom]: toString,
  };
};
