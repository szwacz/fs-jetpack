import * as os from "os";
import * as crypto from "crypto";
import * as fse from "fs-extra";

const originalCwd = process.cwd();
const createdDirectories: string[] = [];

process.on("exit", () => {
  // In case something went wrong and some temp
  // directories are still on the disk.
  createdDirectories.forEach((path) => {
    fse.removeSync(path);
  });
});

export const setCleanTestCwd = () => {
  const random = crypto.randomBytes(16).toString("hex");
  const path = `${os.tmpdir()}/fs-jetpack-test-${random}`;
  fse.mkdirSync(path);
  createdDirectories.push(path);
  process.chdir(path);
};

export const switchBackToCorrectCwd = () => {
  const path = createdDirectories.pop();
  process.chdir(originalCwd);
  try {
    fse.removeSync(path);
  } catch (err) {
    // On Windows platform sometimes removal of the directory leads to error:
    // Error: ENOTEMPTY: directory not empty, rmdir
    // Let's retry the attempt.
    fse.removeSync(path);
  }
};