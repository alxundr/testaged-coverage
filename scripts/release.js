const fetch = require('node-fetch');
const chalk = require('chalk');
const minimist = require('minimist');
const pkg = require('../package.json');
require('dotenv').config();

const fetchLatestRelease = async () => {
  const response = await fetch(`https://api.github.com/repos/alxundr/${pkg.name}/releases/latest`);
  return response.json();
};

const createRelease = async () => {
  try {
    const argv = minimist(process.argv.slice(2));
    const { html_url, tag_name } = await fetchLatestRelease();

    console.log(chalk.yellow('found latest release:', html_url));

    if (tag_name === pkg.version) {
      throw new Error('version in package.json has not been updated');
    }

    if (!argv.body) {
      throw new Error('argv body not specified');
    }

    const body = JSON.stringify({
      tag_name: pkg.version,
      name: pkg.version,
      body: argv.body,
      target_commitish: 'master',
      draft: argv.draft === 'true',
      prerelease: argv.prerelease === 'true',
    });

    console.log(chalk.yellow(`https://api.github.com/repos/alxundr/${pkg.name}/releases`));
    console.log(chalk.yellow('requesting with body', body));

    const response = await fetch(`https://api.github.com/repos/alxundr/${pkg.name}/releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `token ${process.env.GITHUB_TOKEN}` },
      body,
    });

    const result = await response.json();

    if (response.status !== 201) {
      throw new Error(result.message);
    }

    console.log(chalk.green(JSON.stringify(result)));
    process.exit(0);
  } catch (e) {
    console.log(chalk.red(e.message));
    process.exit(1);
  }
};

module.exports = createRelease;
