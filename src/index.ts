import { resolve } from "path";

import program from "commander";
import chalk from "chalk";
import { getPackageInfo } from "get-package-info";

import { resolveRepo, outputRepoFormats, pullRepo, selectTemplate } from "./utils";
import createProject from "./createProject";

program
  .version(getPackageInfo(resolve(__dirname, "..")).version)
  .option("-t, --template <x-template-repo>", "create project from x-template-repo", resolveRepo)
  .option("-i, --index <x-index-repo>", "show templates descriped in x-index to select", resolveRepo)
  .parse(process.argv);

const { template: templateRepo, index: indexRepo } = program;

if (typeof templateRepo === "string") {
  if (!templateRepo.length) {
    console.log(chalk.red("Invalid <x-template-repo>"));
    outputRepoFormats();
  } else {
    pullRepo(templateRepo)
      .then(repoPath => createProject(repoPath))
      .catch(error => console.log(chalk.red(error)));
  }
} else
if (typeof indexRepo === "string") {
  if (!indexRepo.length) {
    console.log(chalk.red("Invalid <x-index-repo>"));
    outputRepoFormats();
  } else {
    pullRepo(indexRepo)
      .then(repoPath => selectTemplate(repoPath))
      .then(templatePath => createProject(templatePath))
      .catch(error => console.log(chalk.red(error)));
  }
} else {
  program.outputHelp(chalk.red);
}
