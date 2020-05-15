'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');
const minimist = require('minimist');

async function findTests() {
  const fileRegex = /src\/[a-zA-Z](.+)(jsx|js|tsx|ts)/;
  const testRegex = /(test|spec)/;
  const { stdout } = await exec('git diff --name-only --cached');
  const endsWith = file => file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx');
  const stagedFiles = [];

  const isFileInBasedir = _file => {
    const argv = minimist(process.argv.slice(2));
    const basedir = argv.basedir !== undefined ? argv.basedir.split(' ') : ['src'];
    debugger;
    return basedir.some(dir => _file.startsWith(dir));
  };

  for (const file of stdout.split('\n')) {
    if (!testRegex.test(file) && isFileInBasedir(file) && endsWith(file) && stagedFiles.indexOf(file) === -1) {
      stagedFiles.push(file);
    } else if (testRegex.test(file) && file.startsWith('src') && endsWith(file)) {
      const newFile = file.replace('/__tests__', '').replace('.test', '').replace('.spec', '');
      if (stagedFiles.indexOf(newFile) === -1) {
        stagedFiles.push(newFile);
      }
    }
  }
  return stagedFiles;
}

async function executeTests() {
  const { stdout } = await exec('npx jest --showConfig');
  const { coverageThreshold } = JSON.parse(stdout).globalConfig;
  if (!coverageThreshold) {
    console.error(chalk.red('\ncoverageThreshold not found!\n'));
    process.exit(1);
  }
  console.log(chalk.green(`\ncoverageThreshold found:`));
  console.log(chalk.green(JSON.stringify(coverageThreshold)));
  const files = await findTests();
  if (files.length === 0) {
    console.log(chalk.yellow('\nNo tests matched!\n'));
    process.exit(0);
  }

  const npmCommand = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

  const test = require('child_process').spawn(
    npmCommand,
    ['run', 'test', '--', '--findRelatedTests', ...files, '--coverage', '--collectCoverageOnlyFrom', ...files, '--passWithNoTests'],
    {
      stdio: 'inherit',
    }
  );

  test.on('close', code => {
    process.exit(code);
  });
}

module.exports = {
  executeTests,
};
