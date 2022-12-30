import { inspect } from "util";
import { resolve } from "path";
import { constructFile, File } from "./file";
import { emptyDirSync, emptyDirAsync } from "./empty";
import { removeSync, removeAsync } from "./remove";

export interface Dir {
  path(): string;
  dir(...pathParts: string[]): Dir;
  file(...pathParts: string[]): File;
  empty(): void;
  emptyAsync(): Promise<void>;
  remove(path?: string): void;
  removeAsync(path?: string): Promise<void>;
  toString(): string;
}

const allArrayElementsAreStrings = (arr: any[]) => {
  return arr.reduce((accumulator: boolean, currentValue: any) => {
    if (accumulator === false) {
      return false;
    }
    return typeof currentValue === "string";
  }, true);
};

const pathPartsValid = (pathParts: string[]) => {
  const pathNotProvided = pathParts.length === 0;
  const pathIsEmptyString = pathParts.length === 1 && pathParts[0] === "";
  return (
    pathNotProvided === false &&
    pathIsEmptyString === false &&
    allArrayElementsAreStrings(pathParts) === true
  );
};

export const constructDir = (dirPath: () => string): Dir => {
  const toString = () => {
    return `[fs-jetpack dir ${dirPath()}]`;
  };

  return {
    path: dirPath,
    dir: (...pathParts: string[]) => {
      if (pathPartsValid(pathParts) === false) {
        throw new Error(`Method "dir()" received invalid path parameter`);
      }
      const newDirPath = resolve(dirPath(), ...pathParts);
      return constructDir(() => newDirPath);
    },
    file: (...pathParts: string[]) => {
      if (pathPartsValid(pathParts) === false) {
        throw new Error(`Method "file()" received invalid path parameter`);
      }
      return constructFile(resolve(dirPath(), ...pathParts));
    },
    empty:() => {
      emptyDirSync(dirPath())
    },
    emptyAsync:(): Promise<void> => {
      return emptyDirAsync(dirPath())
    },
    remove: (path?: string) => {
      if (path === undefined) {
        removeSync(dirPath());
      } else {
        if (typeof path !== "string" || path === "") {
          throw new Error(
            `Method "dir.remove()" received invalid path parameter`
          );
        }
        removeSync(resolve(dirPath(), path));
      }
    },
    removeAsync: (path?: string): Promise<void> => {
      if (path === undefined) {
        return removeAsync(dirPath());
      }
      if (typeof path !== "string" || path === "") {
        throw new Error(
          `Method "dir.removeAsync()" received invalid path parameter`
        );
      }
      return removeAsync(resolve(dirPath(), path));
    },
    toString,
    // @ts-ignore
    [inspect.custom]: toString,
  };
};
