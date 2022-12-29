import { inspect } from "util";
import { resolve } from "path";
import { removeSync, removeAsync } from "./remove";

export interface File {
  path(): string;
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
