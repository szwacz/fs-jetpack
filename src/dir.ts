import { inspect } from "util";
import { resolve } from "path";

import { constructFile } from "./file";

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

export const constructDir = (dirPath: () => string) => {
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
    toString,
    [inspect.custom]: toString,
  };
};
