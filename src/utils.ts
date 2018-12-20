export const outputRepoFormats = () => {
  console.log("\n%s\n\n%s\n%s\n%s\n%s\n", ...[
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

export const pullRepo = (repo: string) => {
  return new Promise<string>((resolve, reject) => {
    resolve("repoPath");
  });
};

export const selectTemplate = (repoPath: string) => {
  return new Promise<string>((resolve, reject) => {
    resolve("templatePath");
  });
}
