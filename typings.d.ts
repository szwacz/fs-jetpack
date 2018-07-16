interface FSJetpack {
  cwd: {
    (): string;
    (...pathParts: string[]): FSJetpack
  };

  path(...pathParts: string[]): string;

  // append: (
  //   path: string,
  //   data: string | Buffer,
  //   options: {
  //     mode: string | number;
  //   }
  // ): void;
  // appendAsync: (
  //   path: string,
  //   data: string | Buffer,
  //   options: {
  //     mode: string | number;
  //   }
  // ): Promise<void>;
};

// copy: (from, to, options) => {
//   copy.validateInput("copy", from, to, options);
//   copy.sync(resolvePath(from), resolvePath(to), options);
// },
// copyAsync: (from, to, options) => {
//   copy.validateInput("copyAsync", from, to, options);
//   return copy.async(resolvePath(from), resolvePath(to), options);
// },
//
// createWriteStream: (path, options) => {
//   return streams.createWriteStream(resolvePath(path), options);
// },
// createReadStream: (path, options) => {
//   return streams.createReadStream(resolvePath(path), options);
// },
//
// dir: (path, criteria) => {
//   dir.validateInput("dir", path, criteria);
//   const normalizedPath = resolvePath(path);
//   dir.sync(normalizedPath, criteria);
//   return cwd(normalizedPath);
// },
// dirAsync: (path, criteria) => {
//   dir.validateInput("dirAsync", path, criteria);
//   return new Promise((resolve, reject) => {
//     const normalizedPath = resolvePath(path);
//     dir.async(normalizedPath, criteria).then(() => {
//       resolve(cwd(normalizedPath));
//     }, reject);
//   });
// },
//
// exists: path => {
//   exists.validateInput("exists", path);
//   return exists.sync(resolvePath(path));
// },
// existsAsync: path => {
//   exists.validateInput("existsAsync", path);
//   return exists.async(resolvePath(path));
// },
//
// file: (path, criteria) => {
//   file.validateInput("file", path, criteria);
//   file.sync(resolvePath(path), criteria);
//   return api;
// },
// fileAsync: (path, criteria) => {
//   file.validateInput("fileAsync", path, criteria);
//   return new Promise((resolve, reject) => {
//     file.async(resolvePath(path), criteria).then(() => {
//       resolve(api);
//     }, reject);
//   });
// },
//
// find: (startPath, options) => {
//   // startPath is optional parameter, if not specified move rest of params
//   // to proper places and default startPath to CWD.
//   if (typeof options === "undefined" && typeof startPath === "object") {
//     options = startPath;
//     startPath = ".";
//   }
//   find.validateInput("find", startPath, options);
//   return find.sync(resolvePath(startPath), normalizeOptions(options));
// },
// findAsync: (startPath, options) => {
//   // startPath is optional parameter, if not specified move rest of params
//   // to proper places and default startPath to CWD.
//   if (typeof options === "undefined" && typeof startPath === "object") {
//     options = startPath;
//     startPath = ".";
//   }
//   find.validateInput("findAsync", startPath, options);
//   return find.async(resolvePath(startPath), normalizeOptions(options));
// },
//
// inspect: (path, fieldsToInclude) => {
//   inspect.validateInput("inspect", path, fieldsToInclude);
//   return inspect.sync(resolvePath(path), fieldsToInclude);
// },
// inspectAsync: (path, fieldsToInclude) => {
//   inspect.validateInput("inspectAsync", path, fieldsToInclude);
//   return inspect.async(resolvePath(path), fieldsToInclude);
// },
//
// inspectTree: (path, options) => {
//   inspectTree.validateInput("inspectTree", path, options);
//   return inspectTree.sync(resolvePath(path), options);
// },
// inspectTreeAsync: (path, options) => {
//   inspectTree.validateInput("inspectTreeAsync", path, options);
//   return inspectTree.async(resolvePath(path), options);
// },
//
// list: path => {
//   list.validateInput("list", path);
//   return list.sync(resolvePath(path || "."));
// },
// listAsync: path => {
//   list.validateInput("listAsync", path);
//   return list.async(resolvePath(path || "."));
// },
//
// move: (from, to) => {
//   move.validateInput("move", from, to);
//   move.sync(resolvePath(from), resolvePath(to));
// },
// moveAsync: (from, to) => {
//   move.validateInput("moveAsync", from, to);
//   return move.async(resolvePath(from), resolvePath(to));
// },
//
// read: (path, returnAs) => {
//   read.validateInput("read", path, returnAs);
//   return read.sync(resolvePath(path), returnAs);
// },
// readAsync: (path, returnAs) => {
//   read.validateInput("readAsync", path, returnAs);
//   return read.async(resolvePath(path), returnAs);
// },
//
// remove: path => {
//   remove.validateInput("remove", path);
//   // If path not specified defaults to CWD
//   remove.sync(resolvePath(path || "."));
// },
// removeAsync: path => {
//   remove.validateInput("removeAsync", path);
//   // If path not specified defaults to CWD
//   return remove.async(resolvePath(path || "."));
// },
//
// rename: (path, newName) => {
//   rename.validateInput("rename", path, newName);
//   rename.sync(resolvePath(path), newName);
// },
// renameAsync: (path, newName) => {
//   rename.validateInput("renameAsync", path, newName);
//   return rename.async(resolvePath(path), newName);
// },
//
// symlink: (symlinkValue, path) => {
//   symlink.validateInput("symlink", symlinkValue, path);
//   symlink.sync(symlinkValue, resolvePath(path));
// },
// symlinkAsync: (symlinkValue, path) => {
//   symlink.validateInput("symlinkAsync", symlinkValue, path);
//   return symlink.async(symlinkValue, resolvePath(path));
// },
//
// write: (path, data, options) => {
//   write.validateInput("write", path, data, options);
//   write.sync(resolvePath(path), data, options);
// },
// writeAsync: (path, data, options) => {
//   write.validateInput("writeAsync", path, data, options);
//   return write.async(resolvePath(path), data, options);
// }

declare const jetpack: FSJetpack;

export = jetpack;
