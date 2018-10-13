/// <reference types="node" />

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
  symlinks?: "report" | "follow";
};

export interface InspectTreeResult extends InspectResult {
  relativePath: string;
  children: InspectTreeResult[];
}

type WritableData = string | object | Array<any> | Buffer;

type WriteOptions = {
  atomic?: boolean;
  jsonIndent?: number;
};

export interface FSJetpack {
  cwd: {
    (): string;
    (...pathParts: string[]): FSJetpack;
  };

  path(...pathParts: string[]): string;

  append(path: string, data: AppendData, options?: AppendOptions): void;
  appendAsync(
    path: string,
    data: AppendData,
    options?: AppendOptions
  ): Promise<void>;

  copy(from: string, to: string, options?: CopyOptions): void;
  copyAsync(from: string, to: string, options?: CopyOptions): Promise<void>;

  createWriteStream: typeof fs.createWriteStream;
  createReadStream: typeof fs.createReadStream;

  dir(path: string, criteria?: DirCriteria): FSJetpack;
  dirAsync(path: string, criteria?: DirCriteria): Promise<FSJetpack>;

  exists(path: string): ExistsResult;
  existsAsync(path: string): Promise<ExistsResult>;

  file(path: string, criteria?: FileOptions): FSJetpack;
  fileAsync(path: string, criteria?: FileOptions): Promise<FSJetpack>;

  find(options?: FindOptions): string[];
  find(startPath: string, options?: FindOptions): string[];
  findAsync(options?: FindOptions): Promise<string[]>;
  findAsync(startPath: string, options?: FindOptions): Promise<string[]>;

  inspect(path: string, options?: InspectOptions): InspectResult | undefined;
  inspectAsync(
    path: string,
    options?: InspectOptions
  ): Promise<InspectResult | undefined>;

  inspectTree(
    path: string,
    options?: InspectTreeOptions
  ): InspectTreeResult | undefined;
  inspectTreeAsync(
    path: string,
    options?: InspectTreeOptions
  ): Promise<InspectTreeResult | undefined>;

  list(path?: string): string[] | undefined;
  listAsync(path?: string): Promise<string[] | undefined>;

  move(from: string, to: string): void;
  moveAsync(from: string, to: string): Promise<void>;

  read(path: string): string | undefined;
  read(path: string, returnAs: "utf8"): string | undefined;
  read(path: string, returnAs: "buffer"): Buffer | undefined;
  read(path: string, returnAs: "json" | "jsonWithDates"): any | undefined;
  readAsync(path: string): Promise<string | undefined>;
  readAsync(path: string, returnAs: "utf8"): Promise<string | undefined>;
  readAsync(path: string, returnAs: "buffer"): Promise<Buffer | undefined>;
  readAsync(
    path: string,
    returnAs: "json" | "jsonWithDates"
  ): Promise<any | undefined>;

  remove(path?: string): void;
  removeAsync(path?: string): Promise<void>;

  rename(path: string, newName: string): void;
  renameAsync(path: string, newName: string): Promise<void>;

  symlink(symlinkValue: string, path: string): void;
  symlinkAsync(symlinkValue: string, path: string): Promise<void>;

  write(path: string, data: WritableData, options?: WriteOptions): void;
  writeAsync(
    path: string,
    data: WritableData,
    options?: WriteOptions
  ): Promise<void>;
}
