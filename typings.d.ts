type OverwriteFunction = (srcInspectData: any, destInspectData: any) => boolean | Promise<boolean>; // TODO not any!

type FindOptions = {
  matching?: string | string[];
  files?: boolean;
  directories?: boolean;
  recursive?: boolean;
};

export type Checksum = 'md5' | 'sha1' | 'sha256' | 'sha512';

type InspectOptions = {
  checksum?: Checksum;
  mode?: boolean;
  times?: boolean;
  absolutePath?: boolean;
  symlinks?: "report" | "follow";
};

interface InspectResult {
  name: string;
  type: "file" | "dir" | "symlink";
  size: number;
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

interface InspectTreeResult extends InspectResult {
  relativePath: string;
  children: InspectTreeResult[];
}

type WritableData = string | object | Array<any> | Buffer;

type WriteOptions = {
  atomic?: boolean;
  jsonIndent?: number;
};

interface FSJetpack {
  cwd: {
    (): string;
    (...pathParts: string[]): FSJetpack
  };

  path(...pathParts: string[]): string;

  append(
    path: string,
    data: string | Buffer,
    options?: {
      mode?: string | number;
    }
  ): void;
  appendAsync(
    path: string,
    data: string | Buffer,
    options?: {
      mode?: string | number;
    }
  ): Promise<void>;

  copy(
    from: string,
    to: string,
    options?: {
      overwrite?: boolean | OverwriteFunction;
      matching?: string | string[]
    }
  ): void;
  copyAsync(
    from: string,
    to: string,
    options?: {
      overwrite?: boolean | OverwriteFunction;
      matching?: string | string[];
    }
  ): Promise<void>;

  createWriteStream(path: any, options?: any): any; // TODO
  createReadStream(path: any, options?: any): any; // TODO

  dir(
    path: string,
    criteria?: {
      empty?: boolean,
      mode?: string | number
    }
  ): FSJetpack;
  dirAsync(
    path: string,
    criteria?: {
      empty?: boolean,
      mode?: string | number
    }
  ): Promise<FSJetpack>;

  exists(path: string): false | "dir" | "file" | "other";
  existsAsync(path: string): Promise<false | "dir" | "file" | "other">;

  file(
    path: string,
    criteria?: {
      content?: WritableData;
      jsonIndent?: number;
      mode?: string | number;
    }
  ): FSJetpack;
  fileAsync(
    path: string,
    criteria?: {
      content?: WritableData;
      jsonIndent?: number;
      mode?: string | number;
    }
  ): Promise<FSJetpack>;

  find(options?: FindOptions): string[];
  find(startPath: string, options?: FindOptions): string[];
  findAsync(options?: FindOptions): Promise<string[]>;
  findAsync(startPath: string, options?: FindOptions): Promise<string[]>;

  inspect(path: string, options?: InspectOptions): InspectResult;
  inspectAsync(path: string, options?: InspectOptions): Promise<InspectResult>;

  inspectTree(path: string, options?: InspectTreeOptions): InspectTreeResult,
  inspectTreeAsync(path: string, options?: InspectTreeOptions): Promise<InspectTreeResult>,

  list(path?: string): string[];
  listAsync(path?: string): Promise<string[]>;

  move(from: string, to: string): void;
  moveAsync(from: string, to: string): Promise<void>;

  read(path: string, returnAs?: string): any; // TODO returnAs i any!!!!
  readAsync(path: string, returnAs?: string): any; // TODO

  remove(path?: string): void;
  removeAsync(path?: string): Promise<void>;

  rename(path:string, newName: string): void;
  renameAsync(path:string, newName: string): Promise<void>;

  symlink(symlinkValue, path): any; // TODO
  symlinkAsync(symlinkValue, path): any; // TODO

  write(path: string, data: WritableData, options?: WriteOptions): void;
  writeAsync(path: string, data: WritableData, options?: WriteOptions): Promise<void>;
}

declare const jetpack: FSJetpack;

export = jetpack;
