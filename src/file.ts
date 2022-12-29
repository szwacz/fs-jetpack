import { inspect } from "util";
import { resolve } from "path";

export const constructFile = (filePath: string) => {
  const path = () => {
    return filePath;
  };

  const toString = () => {
    return `[fs-jetpack file ${path()}]`;
  };

  return {
    path,
    toString,
    [inspect.custom]: toString,
  };
};
