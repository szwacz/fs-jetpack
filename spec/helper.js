"use strict";

const os = require("os");
const crypto = require("crypto");
const fse = require("fs-extra");

const originalCwd = process.cwd();
const createdDirectories = [];

process.on("exit", () => {
  // In case something went wrong and some temp
  // directories are still on the disk.
  createdDirectories.forEach(path => {
    fse.removeSync(path);
  });
});

exports.setCleanTestCwd = () => {
  const random = crypto.randomBytes(16).toString("hex");
  const path = `${os.tmpdir()}/fs-jetpack-test-${random}`;
  fse.mkdirSync(path);
  createdDirectories.push(path);
  process.chdir(path);
};

exports.switchBackToCorrectCwd = () => {
  const path = createdDirectories.pop();
  process.chdir(originalCwd);
  fse.removeSync(path);
};

exports.parseMode = modeAsNumber => {
  const mode = modeAsNumber.toString(8);
  return mode.substring(mode.length - 3);
};

// Converts paths to windows or unix formats depending on platform running.
exports.osSep = path => {
  if (Array.isArray(path)) {
    return path.map(exports.osSep);
  }

  if (process.platform === "win32") {
    return path.replace(/\//g, "\\");
  }
  return path.replace(/\\/g, "/");
};
