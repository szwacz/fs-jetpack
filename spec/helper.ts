import * as os from "os";
import * as crypto from "crypto";
import * as fse from "fs-extra";

const originalCwd = process.cwd();
const createdDirectories = [];

process.on("exit", () => {
  // In case something went wrong and some temp
  // directories are still on the disk.
  createdDirectories.forEach(path => {
    fse.removeSync(path);
  });
});

const setCleanTestCwd = () => {
  const random = crypto.randomBytes(16).toString("hex");
  const path = `${os.tmpdir()}/fs-jetpack-test-${random}`;
  fse.mkdirSync(path);
  createdDirectories.push(path);
  process.chdir(path);
};

const switchBackToCorrectCwd = () => {
  const path = createdDirectories.pop();
  process.chdir(originalCwd);
  fse.removeSync(path);
};

const parseMode = modeAsNumber => {
  const mode = modeAsNumber.toString(8);
  return mode.substring(mode.length - 3);
};

// Converts paths to windows or unix formats depending on platform running.
const osSep = path => {
  if (Array.isArray(path)) {
    return path.map(osSep);
  }

  if (process.platform === "win32") {
    return path.replace(/\//g, "\\");
  }
  return path.replace(/\\/g, "/");
};

export default {
  setCleanTestCwd,
  switchBackToCorrectCwd,
  parseMode,
  osSep
};
