import { resolve } from "path";

import fs from "fs-extra";

export default function createProject(destination: string, templatePath: string) {
  fs.emptyDirSync(destination);
  fs.copySync(resolve(templatePath, "files"), destination);
  // TODO: configure project
}
