import { resolve } from "path";

import program from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import { sync as isEmptyDir } from "empty-dir";
import { getPackageInfo } from "get-package-info";

import { resolveRepo, outputRepoFormats, syncRepo, selectTemplate } from "./utils";
import createProject from "./createProject";

program
  .version(getPackageInfo(resolve(__dirname, "..")).version)
  .usage("[options] <project-dir>")
  .option("-t, --template <x-template-repo>", "create project from x-template-repo", resolveRepo)
  .option("-i, --index <x-index-repo>", "show templates descriped in x-index-repo to select", resolveRepo)
  .parse(process.argv);

const { template: templateRepo, index: indexRepo, args } = program;

if (args.length !== 1) {
  program.outputHelp(chalk.red);
  process.exit(1); // TODO: commander's bug?
}

const projectDir = resolve(process.cwd(), args[0]);

if (fs.pathExistsSync(projectDir) && !isEmptyDir(projectDir)) {
  console.log(chalk.red(`Directory "${projectDir}" is not empty, nothing to do\n`))
  process.exit(1);
}

if (typeof templateRepo === "string") {
  if (!templateRepo.length) {
    console.log(chalk.red("Invalid <x-template-repo>\n"));
    outputRepoFormats();
  } else {
    syncRepo(templateRepo)
      .then(repoPath => createProject(projectDir, repoPath))
      .catch(error => console.log(chalk.red(error)));
  }

} else
if (typeof indexRepo === "string") {
  if (!indexRepo.length) {
    console.log(chalk.red("Invalid <x-index-repo>\n"));
    outputRepoFormats();
  } else {
    syncRepo(indexRepo)
      .then(repoPath => selectTemplate(repoPath))
      .then(templatePath => createProject(projectDir, templatePath))
      .catch(error => console.log(chalk.red(error)));
  }

} else {
  console.log(chalk.red("Require '--template' or '--index' parameter\n"));
  program.outputHelp();
}
