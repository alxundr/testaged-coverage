const fetch = require('node-fetch');
const chalk = require('chalk');
const minimist = require('minimist');
const pkg = require('../package.json');
const dotenv = require('dotenv');

dotenv.config();

const githubClient = () => {
  const releasesApiUrl = `https://api.github.com/repos/alxundr/${pkg.name}/releases`;

  const fetchLatestRelease = async () => {
    const response = await fetch(`${releasesApiUrl}/latest`);
    return response.json();
  };

  const postRelease = async ({ message, draft = false, prerelease = false }) => {
    const body = JSON.stringify({
      tag_name: pkg.version,
      name: pkg.version,
      body: message,
      target_commitish: 'master',
      draft: draft,
      prerelease: prerelease,
    });

    console.log(chalk.yellow(releasesApiUrl));
    console.log(chalk.yellow('requesting with body', body));

    const response = await fetch(releasesApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `token ${process.env.GITHUB_TOKEN}` },
      body,
    });

    const json = await response.json();

    if (response.status !== 201) {
      throw new Error(json.message);
    }

    return json;
  };

  return {
    fetchLatestRelease,
    postRelease,
  };
};

const createRelease = async () => {
  try {
    const argv = minimist(process.argv.slice(2));

    const { html_url, tag_name } = await githubClient().fetchLatestRelease();

    console.log(chalk.yellow('found latest release:', html_url));

    if (tag_name === pkg.version) {
      throw new Error('version in package.json has not been updated');
    }

    if (!argv.body) {
      throw new Error('argv body not specified');
    }

    const json = await githubClient().postRelease({ message: argv.body, draft: argv.draft, prerelease: argv.prerelease });

    console.log(chalk.green(JSON.stringify(json)));
    process.exit(0);
  } catch (e) {
    console.log(chalk.red(e.message));
    process.exit(1);
  }
};

module.exports = createRelease;
