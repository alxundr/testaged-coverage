'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');

async function findTests() {
  const fileRegex = /src\/[a-zA-Z](.+)(jsx|js|tsx|ts)/;
  const testRegex = /(test|spec)/;
  const { stdout } = await exec('git diff --name-only --cached');
  const endsWith = file => file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx');
  const stagedFiles = [];
  for (const file of stdout.split('\n')) {
    if (!testRegex.test(file) && file.startsWith('src') && endsWith(file) && stagedFiles.indexOf(file) === -1) {
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
  try {
    const { stdout } = await exec(
      `npm run test -- --findRelatedTests ${files.join(' ')} --coverage --collectCoverageOnlyFrom ${files.join(' ')}`
    );
    console.log(chalk.green(stdout));
    process.exit(0);
  } catch (e) {
    console.error(chalk.red('\nThere is an error\n'));
    console.error(chalk.red(e.message));
    process.exit(1);
  }
}

module.exports = {
  executeTests,
};
