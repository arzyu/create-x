#!/usr/bin/env node

import { resolve, basename } from "path";

import program from "commander";
import fs from "fs-extra";
import { sync as isEmptyDir } from "empty-dir";
import { getJson } from "@arzyu/get-json";
import { sync as globSync } from "glob";
import render from "es6-template-strings";
import inquirer from "inquirer";

import { resolveRepo, syncRepo, selectTemplate } from "./utils";
import createProject from "./createProject";

program
  .version(getJson(resolve(__dirname, "../package.json")).version)
  .usage("[options] <new-project-dir-or-path>")
  .option("--from <repository>", "which git repository to use", resolveRepo)
  .parse(process.argv);

const cwd = process.cwd();
const { from: repo, args } = program;
const projectPath = (args[0] || "").length ? resolve(cwd, args[0]) : "";

const isValidDestination = (destination: string) => {
  return destination.length && !fs.pathExistsSync(destination) || isEmptyDir(destination);
};

const isValidRepo = (url: string) => resolveRepo(url).length > 0;

const cmdQuestions = [{
  type: "input",
  name: "destination",
  message: "Enter new project directory or path:",
  when: (answers: any) => {
    return !projectPath.length || !isValidDestination(answers.destination = projectPath);
  },
  filter: (input: string) => input.length ? resolve(cwd, input) : "",
  validate: (input: string) => {
    return isValidDestination(input) || (input.length ? `Directory already exists: ${input}` : "");
  }
}, {
  type: "input",
  name: "repo",
  message: "Which git repository to use:",
  when: (answers: any) => !isValidRepo(answers.repo = repo),
  filter: (input: string) => resolveRepo(input),
  validate: (input: string) => isValidRepo(input) || `Invalid git repository url!`
}];

(async () => {
  const options = await inquirer.prompt(cmdQuestions);

  const { destination, repo } = options;

  Object.assign(options, {
    directory: basename(destination)
  });

  const templatePath = await syncRepo(repo)
    .then(repoPath => selectTemplate(repoPath))
    .catch(error => { throw error });

  const projectConfigFile = `${templatePath}/config.js`;
  const answers = {};
  const rewrites = [];

  if (fs.pathExistsSync(projectConfigFile)) {
    const { questions, files}  = require(projectConfigFile);

    if (Array.isArray(files) && files.length) {
      rewrites.push(...files);

      if (Array.isArray(questions) && questions.length) {
        Object.assign(answers, await inquirer.prompt(questions))
      }
    }
  }

  createProject(destination, templatePath);

  rewrites.forEach(([glob, fn]) => {
    globSync(glob, { cwd: destination }).forEach(filename => {
      const filePath = resolve(destination, filename);

      if (fs.statSync(filePath).isFile()) {
        const template = fs.readFileSync(filePath, { encoding: "utf8" });
        const data = fn.call(null, answers, options);
        const result = render(template, data);

        fs.writeFileSync(filePath, result);
      }
    });
  });
})();

/* vim: ft=ts */
