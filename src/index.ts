import { constructDir } from "./dir";

const defaultDir = constructDir(() => process.cwd());
const dir = defaultDir.dir;
const file = defaultDir.file;

export { dir, file };

export default defaultDir;
