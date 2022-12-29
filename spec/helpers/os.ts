/**
 * Normalizes file paths for operating system we're currently running on.
 */
export const osPath = (path: string) => {
  if (process.platform === "win32") {
    return path.replace(/\//g, "\\");
  }
  return path;
};
