#!/usr/bin/env node

import { resolve } from "path";

import program from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import { sync as isEmptyDir } from "empty-dir";
import { getJson } from "@arzyu/get-json";

import { resolveRepo, outputRepoFormats, syncRepo, selectTemplate } from "./utils";
import createProject from "./createProject";

program
  .version(getJson(resolve(__dirname, "../package.json")).version)
  .usage("[options] <project-dir>")
  .option("--from <template-repo/template-collection-repo>", "create project from template", resolveRepo)
  .parse(process.argv);

const { from: repo, args } = program;

if (args.length !== 1) {
  program.outputHelp(chalk.red);
  process.exit(1); // TODO: commander's bug?
}

const projectDir = resolve(process.cwd(), args[0]);

if (fs.pathExistsSync(projectDir) && !isEmptyDir(projectDir)) {
  console.log(chalk.red(`Directory "${projectDir}" is not empty, nothing to do\n`))
  process.exit(1);
}

if (typeof repo !== "string") {
  console.log(chalk.red("Require '--from' parameter\n"));
  program.outputHelp();
} else {
  if (!repo.length) {
    console.log(chalk.red("Invalid <template-repo/template-collection-repo>\n"));
    outputRepoFormats();
  } else {
    syncRepo(repo)
      .then(repoPath => selectTemplate(repoPath))
      .then(templatePath => createProject(projectDir, templatePath))
      .catch(error => console.log(chalk.red(error)));
  }
}
