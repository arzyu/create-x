import path from "path";
import { spawnSync } from "child_process";

import chalk from "chalk";
import fs from "fs-extra";
import { getPackageInfo } from "get-package-info";
import { sync as globSync } from "glob";
import inquirer from "inquirer";
import uuid from "uuid";

export const outputRepoFormats = () => {
  console.log("%s\n\n%s\n%s\n%s\n%s\n", ...[
    "Expected repo formats:",
    " * github-user/repo",
    " * https://github.com/user/repo",
    " * git@github.com:user/repo.git",
    " * ssh://git@github.com:user/repo.git"
  ]);
  process.exit(1);
};

export const resolveRepo = (repo: string) => {
  type RepoPattern = {
    test: RegExp;
    resolve?: (repo: string) => string;
  };

  const patterns: RepoPattern[] = [
    { test: /^[^\/]+\/[^\/]+$/, resolve: repo => `https://github.com/${repo}` },
    { test: /^https?:\/\/.+$/ },
    { test: /^git@.+$/ },
    { test: /^ssh:\/\/git@.+$/ }
  ];

  let resolvedRepo = "";

  patterns.some(({ test, resolve }) => {
    const matched = test.test(repo);

    if (matched) {
      resolvedRepo = resolve ? resolve(repo) : repo;
    }

    return matched;
  });

  return resolvedRepo;
};

export const syncRepo = (repo: string) => {
  const cachePath = path.resolve(__dirname, "../.cache");
  const manifestPath = path.resolve(cachePath, "menifest.json");

  if (!fs.pathExistsSync(manifestPath)) {
    fs.outputJSONSync(manifestPath, {}, { spaces: 2 });
  }

  const repos = fs.readJSONSync(manifestPath);

  let repoDir = repos[repo] || uuid.v4();
  let repoPath = path.resolve(cachePath, repoDir);

  if (!repos[repo]) {
    fs.writeJSONSync(manifestPath, Object.assign({ [repo]: repoDir }, repos), { spaces: 2 });
  }

  if (!fs.pathExistsSync(repoPath)) {
    fs.mkdirpSync(repoPath);

    const initRepoCmd = [
      "git init",
      `git remote add origin ${repo}`
    ].join(" && ");

    spawnSync(initRepoCmd, { shell: true, cwd: repoPath, stdio: [null, "inherit", "inherit"]});
  }

  return new Promise<string>((resolve, reject) => {
    const syncRepoCmd = [
      "git fetch",
      "git reset origin/master --hard",
      "git submodule update --init --remote"
    ].join(" && ");

    spawnSync(syncRepoCmd, { shell: true, cwd: repoPath, stdio: [null, "inherit", "inherit"] });
    resolve(repoPath);
  });
};

export const selectTemplate = (repoPath: string) => {
  const isValidTemplate = (templatePath: string) => {
    const templateFiles = path.resolve(templatePath, "files/");
    const templatePackage = path.resolve(templatePath, "package.json");

    return fs.existsSync(templateFiles) && fs.statSync(templateFiles).isDirectory() &&
        fs.existsSync(templatePackage) && fs.statSync(templatePackage).isFile();
  };

  if (isValidTemplate(repoPath)) {
    return Promise.resolve(repoPath);
  }

  const templatePaths = globSync("*/", { cwd: repoPath })
      .map(item => path.resolve(repoPath, item))
      .filter(templatePath => isValidTemplate(templatePath));

  if (!templatePaths.length) {
    throw new Error(chalk.red("No available x-templates"));
  }

  const choices: Array<{ name: string, value: any }> = [];

  templatePaths.forEach(templatePath => {
    const templateName = path.basename(templatePath);
    const description = getPackageInfo(templatePath).description || "No description in package.json";

    choices.push({ name: `${templateName}, ${description}`, value: templatePath });
  });

  return inquirer.prompt([
    {
      type: "list",
      name: "templatePath",
      message: "Choose a template:",
      choices
    }
  ]).then((answers: any) => answers.templatePath);
}
