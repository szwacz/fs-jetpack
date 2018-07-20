import * as fs from "fs";

const areBuffersEqual = (bufA: Buffer, bufB: Buffer) => {
  const len = bufA.length;
  if (len !== bufB.length) {
    return false;
  }
  for (let i = 0; i < len; i += 1) {
    if (bufA.readUInt8(i) !== bufB.readUInt8(i)) {
      return false;
    }
  }
  return true;
};

export default (path: string) => {
  return {
    shouldNotExist: () => {
      let message;
      try {
        fs.statSync(path);
        message = `Path ${path} should NOT exist`;
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    },

    shouldBeDirectory: () => {
      let message;
      let stat;
      try {
        stat = fs.statSync(path);
        if (!stat.isDirectory()) {
          message = `Path ${path} should be a directory`;
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          message = `Path ${path} should exist`;
        } else {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    },

    shouldBeFileWithContent: (expectedContent: any) => {
      let message;
      let content;

      const generateMessage = (expected: string, found: string) => {
        message = `File ${path} should have content "${expected}" but found "${found}"`;
      };

      try {
        if (Buffer.isBuffer(expectedContent)) {
          content = fs.readFileSync(path);
          if (!areBuffersEqual(expectedContent, content)) {
            generateMessage(
              expectedContent.toString("hex"),
              content.toString("hex")
            );
          }
        } else {
          content = fs.readFileSync(path, "utf8");
          if (content !== expectedContent) {
            generateMessage(expectedContent, content);
          }
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          message = `File ${path} should exist`;
        } else {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    },

    shouldHaveMode: (expectedMode: any) => {
      let mode;
      let message;

      try {
        mode = fs.statSync(path).mode.toString(8);
        mode = mode.substring(mode.length - 3);
        if (mode !== expectedMode) {
          message = `Path ${path} should have mode "${expectedMode}" but have instead "${mode}"`;
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          message = `Path ${path} should exist`;
        } else {
          throw err;
        }
      }
      if (message) {
        throw new Error(message);
      }
    }
  };
};
