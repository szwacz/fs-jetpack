import { constructDir, Dir } from "./dir";

const defaultDir: Dir = constructDir(() => process.cwd());
const dir = defaultDir.dir;
const file = defaultDir.file;

export { dir, file };

export default defaultDir;
