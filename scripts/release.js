const fetch = require('node-fetch');
const chalk = require('chalk');
const minimist = require('minimist');
const pkg = require('../package.json');

const fetchLatestRelease = async () => {
  const response = await fetch(`https://api.github.com/repos/alxundr/${pkg.name}/releases/latest`);
  return response.json();
};

const createRelease = async () => {
  try {
    const argv = minimist(process.argv.slice(2));
    const { html_url, tag_name } = await fetchLatestRelease();

    if (tag_name === pkg.version) {
      throw new Error('version in package.json has not been updated');
    }

    if (!argv.body) {
      throw new Error('argv body not specified');
    }

    const response = await fetch(`https://api.github.com/repos/alxundr/${pkg.name}/releases`, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: pkg.version,
        name: pkg.version,
        body: argv.body,
        draft: argv.draft === 'true',
        prerelease: argv.prerelease === 'true',
      }),
    });
    const result = await response.json();
    console.log(chalk.green(JSON.stringify(result)));
    process.exit(0);
  } catch (e) {
    console.log(chalk.red(e.message));
    process.exit(1);
  }
};

module.exports = createRelease;
