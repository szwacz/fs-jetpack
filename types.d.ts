/// <reference types="node" />

// More docs also available at https://github.com/szwacz/fs-jetpack

import * as fs from "fs";

type AppendData = string | Buffer;

type AppendOptions = {
  mode?: string | number;
};

type OverwriteFunction = (
  srcInspectData: InspectResult,
  destInspectData: InspectResult
) => boolean | Promise<boolean>;

type CopyOptions = {
  overwrite?: boolean | OverwriteFunction;
  matching?: string | string[];
  ignoreCase?: boolean;
};

type DirCriteria = {
  empty?: boolean;
  mode?: string | number;
};

export type ExistsResult = false | "dir" | "file" | "other";

type FileOptions = {
  content?: WritableData;
  jsonIndent?: number;
  mode?: string | number;
};

type FindOptions = {
  matching?: string | string[];
  files?: boolean;
  directories?: boolean;
  recursive?: boolean;
  ignoreCase?: boolean;
};

export type Checksum = "md5" | "sha1" | "sha256" | "sha512";

type InspectOptions = {
  checksum?: Checksum;
  mode?: boolean;
  times?: boolean;
  absolutePath?: boolean;
  symlinks?: "report" | "follow";
};

export interface InspectResult {
  name: string;
  type: "file" | "dir" | "symlink";
  size: number;
  absolutePath?: string;
  md5?: string;
  sha1?: string;
  sha256?: string;
  sha512?: string;
  mode?: number;
  accessTime?: Date;
  modifyTime?: Date;
  changeTime?: Date;
}

type InspectTreeOptions = {
  checksum?: Checksum;
  relativePath?: boolean;
  times?: boolean;
  symlinks?: "report" | "follow";
};

export interface InspectTreeResult extends InspectResult {
  relativePath: string;
  children: InspectTreeResult[];
}

type WritableData = string | object | Array<any> | Buffer;

type WriteOptions = {
  mode?: string | number;
  atomic?: boolean;
  jsonIndent?: number;
};

// API has the same set of synchronous and asynchronous methods.
// All async methods are promise based (no callbacks).

// Commonly used naming convention in Node world is reversed in this library (no 'method' and 'methodSync' naming).
// Asynchronous methods are those with 'Async' suffix, all methods without 'Async' in the name are synchronous.
// Reason behind this is that it gives very nice look to blocking API. And promise-based, non-blocking code is verbose
// anyway, so one more word is not much of a difference.

export interface FSJetpack {
  /**
   * Returns Current Working Directory (CWD) for this instance of jetpack, or creates new jetpack object with given path as its internal CWD.
   *
   * **Note:** fs-jetpack never changes value of `process.cwd()`, the CWD we are talking about here is internal value inside every jetpack instance.
   *
   *  @param path (optional) path (or many path parts) to become new CWD. Could be absolute, or relative. If relative path given new CWD will be resolved basing on current CWD of this jetpack instance.
   */
  cwd: {
    (): string;
    (...pathParts: string[]): FSJetpack;
  };

  path(...pathParts: string[]): string;

  /**
   * Appends given data to the end of file. If file or any parent directory doesn't exist it will be created.
   *
   * @param path  the path to file.
   * @param data  data to append (can be `String` or `Buffer`).
   * @param options
   */
  append(path: string, data: AppendData, options?: AppendOptions): void;

  /**
   * Appends given data to the end of file. If file or any parent directory doesn't exist it will be created.
   *
   * @param path  the path to file.
   * @param data  data to append (can be `String` or `Buffer`).
   * @param options
   */
  appendAsync(
    path: string,
    data: AppendData,
    options?: AppendOptions
  ): Promise<void>;

  /**
   * Copies given file or directory (with everything inside).
   *
   * @param from path to location you want to copy.
   * @param to path to destination location, where the copy should be placed.
   * @param options
   */
  copy(from: string, to: string, options?: CopyOptions): void;

  /**
   * Copies given file or directory (with everything inside).
   *
   * @param from path to location you want to copy.
   * @param to path to destination location, where the copy should be placed.
   * @param options
   */
  copyAsync(from: string, to: string, options?: CopyOptions): Promise<void>;

  /**
   * Just an alias to vanilla [fs.createReadStream](http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).
   */
  createReadStream: typeof fs.createReadStream;
  /**
   * Just an alias to vanilla [fs.createWriteStream](http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options).
   */
  createWriteStream: typeof fs.createWriteStream;

  /**
   * Ensures that directory on given path exists and meets given criteria. If any criterium is not met it will be
   * after this call. If any parent directory in `path` doesn't exist it will be created (like `mkdir -p`).
   *
   * @param path path to directory to examine
   * @param criteria criteria to be met by the directory
   */
  dir(path: string, criteria?: DirCriteria): FSJetpack;

  /**
   * Ensures that directory on given path exists and meets given criteria. If any criterium is not met it will be
   * after this call. If any parent directory in `path` doesn't exist it will be created (like `mkdir -p`).
   *
   * @param path path to directory to examine
   * @param criteria criteria to be met by the directory
   */
  dirAsync(path: string, criteria?: DirCriteria): Promise<FSJetpack>;

  /**
   * Checks whether something exists on given `path`. This method returns values more specific than `true/false` to
   * protect from errors like "I was expecting directory, but it was a file".
   *
   * @param path path to look for
   *
   * Returns:
   *  - `false` if path doesn't exist.
   *  - `"dir"` if path is a directory.
   *  - `"file"` if path is a file.
   *  - `"other"` if none of the above.
   */
  exists(path: string): ExistsResult;
  /**
   * Checks whether something exists on given `path`. This method returns values more specific than `true/false` to
   * protect from errors like "I was expecting directory, but it was a file".
   *
   * @param path path to look for
   *
   * Returns:
   *  - `false` if path doesn't exist.
   *  - `"dir"` if path is a directory.
   *  - `"file"` if path is a file.
   *  - `"other"` if none of the above.
   */
  existsAsync(path: string): Promise<ExistsResult>;

  /**
   * Ensures that file exists and meets given criteria. If any criterium is not met it will be after this call. If
   * any parent directory in `path` doesn't exist it will be created (like `mkdir -p`).
   *
   * @param path the path to create
   * @param criteria criteria to be met by the file
   */
  file(path: string, criteria?: FileOptions): FSJetpack;

  /**
   * Ensures that file exists and meets given criteria. If any criterium is not met it will be after this call. If
   * any parent directory in `path` doesn't exist it will be created (like `mkdir -p`).
   *
   * @param path the path to create
   * @param criteria criteria to be met by the file
   */
  fileAsync(path: string, criteria?: FileOptions): Promise<FSJetpack>;

  /**
   * Finds in directory specified by `path` all files fulfilling `searchOptions`. Returned paths are relative to current CWD of jetpack instance.
   * @param options search options
   */
  find(options?: FindOptions): string[];
  /**
   * Finds in directory specified by `path` all files fulfilling `searchOptions`. Returned paths are relative to current CWD of jetpack instance.
   * @param startPath Path to start search in (all subdirectories will be searched).
   * @param options search options
   */
  find(startPath: string, options?: FindOptions): string[];
  /**
   * Finds in directory specified by `path` all files fulfilling `searchOptions`. Returned paths are relative to current CWD of jetpack instance.
   * @param options search options
   */
  findAsync(options?: FindOptions): Promise<string[]>;
  /**
   * Finds in directory specified by `path` all files fulfilling `searchOptions`. Returned paths are relative to current CWD of jetpack instance.
   * @param startPath Path to start search in (all subdirectories will be searched).
   * @param options search options
   */
  findAsync(startPath: string, options?: FindOptions): Promise<string[]>;

  /**
   * Inspects given path (replacement for `fs.stat`). Returned object by default contains only very basic, not
   * platform-dependent properties (so you have something e.g. your unit tests can rely on), you can enable more
   * properties through options object.
   *
   * @param path path to inspect
   * @param options
   */
  inspect(path: string, options?: InspectOptions): InspectResult | undefined;

  /**
   * Inspects given path (replacement for `fs.stat`). Returned object by default contains only very basic, not
   * platform-dependent properties (so you have something e.g. your unit tests can rely on), you can enable more
   * properties through options object.
   *
   * @param path path to inspect
   * @param options
   */
  inspectAsync(
    path: string,
    options?: InspectOptions
  ): Promise<InspectResult | undefined>;

  /**
   * Calls inspect recursively on given path so it creates a tree of all directories and sub-directories inside it.
   *
   * @param path starting path to inspect
   * @param options
   */
  inspectTree(
    path: string,
    options?: InspectTreeOptions
  ): InspectTreeResult | undefined;

  /**
   * Calls inspect recursively on given path so it creates a tree of all directories and sub-directories inside it.
   *
   * @param path starting path to inspect
   * @param options
   */
  inspectTreeAsync(
    path: string,
    options?: InspectTreeOptions
  ): Promise<InspectTreeResult | undefined>;

  /**
   * Lists the contents of directory. Equivalent of `fs.readdir`.
   * @param path directory to list
   */
  list(path?: string): string[] | undefined;
  /**
   * Lists the contents of directory. Equivalent of `fs.readdir`.
   * @param path directory to list
   */
  listAsync(path?: string): Promise<string[] | undefined>;

  /**
   * Moves given path to new location.
   *
   * @param from path
   * @param to path
   */
  move(from: string, to: string): void;

  /**
   * Moves given path to new location.
   *
   * @param from path
   * @param to path
   */
  moveAsync(from: string, to: string): Promise<void>;

  /**
   * Reads content of file.
   *
   * @param path path to file
   * @param returnAs a custom return types
   */
  read(path: string): string | undefined;
  read(path: string, returnAs: "utf8"): string | undefined;
  read(path: string, returnAs: "buffer"): Buffer | undefined;
  read(path: string, returnAs: "json" | "jsonWithDates"): any | undefined;
  /**
   * Reads content of file.
   *
   * @param path path to file
   * @param returnAs a custom return types
   */
  readAsync(path: string): Promise<string | undefined>;
  readAsync(path: string, returnAs: "utf8"): Promise<string | undefined>;
  readAsync(path: string, returnAs: "buffer"): Promise<Buffer | undefined>;
  readAsync(
    path: string,
    returnAs: "json" | "jsonWithDates"
  ): Promise<any | undefined>;

  /**
   * Deletes given path, no matter what it is (file, directory or non-empty directory). If path already doesn't exist
   * terminates gracefully without throwing, so you can use it as 'ensure path doesn't exist'.
   *
   * @param path path to delete
   */
  remove(path?: string): void;
  /**
   * Deletes given path, no matter what it is (file, directory or non-empty directory). If path already doesn't exist
   * terminates gracefully without throwing, so you can use it as 'ensure path doesn't exist'.
   *
   * @param path path to delete
   */
  removeAsync(path?: string): Promise<void>;

  /**
   * Renames given file or directory.
   *
   * @param path path to file being renamed
   * @param newName just the name of the thing being renamed
   */
  rename(path: string, newName: string): void;
  /**
   * Renames given file or directory.
   *
   * @param path path to file being renamed
   * @param newName just the name of the thing being renamed
   */
  renameAsync(path: string, newName: string): Promise<void>;

  /**
   * Creates symbolic link.
   *
   * @param symlinkValue path where symbolic link should point.
   * @param path  where symbolic link should be put.
   */
  symlink(symlinkValue: string, path: string): void;

  /**
   * Creates symbolic link.
   *
   * @param symlinkValue path where symbolic link should point.
   * @param path  where symbolic link should be put.
   */
  symlinkAsync(symlinkValue: string, path: string): Promise<void>;

  /**
   * Writes data to file. If any parent directory in `path` doesn't exist it will be created (like `mkdir -p`).
   *
   * @param path path to file
   * @param data data to be written. This could be `String`, `Buffer`, `Object` or `Array` (if last two used, the data will be outputted into file as JSON).
   * @param options
   */
  write(path: string, data: WritableData, options?: WriteOptions): void;

  /**
   * Writes data to file. If any parent directory in `path` doesn't exist it will be created (like `mkdir -p`).
   *
   * @param path path to file
   * @param data data to be written. This could be `String`, `Buffer`, `Object` or `Array` (if last two used, the data will be outputted into file as JSON).
   * @param options
   */
  writeAsync(
    path: string,
    data: WritableData,
    options?: WriteOptions
  ): Promise<void>;
}
