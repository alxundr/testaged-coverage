const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');

async function findTests() {
  const fileRegex = /src\/[a-zA-Z](.+)(jsx|js|tsx|ts)/g;
  const testRegex = /(test|spec)/g;
  const { stdout } = await exec('git diff --name-only --cached');
  return stdout.split('\n').filter(file => !testRegex.test(file) && fileRegex.test(file));
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
  const command = `npm run test -- --findRelatedTests ${files.join(' ')} --coverage --collectCoverageOnlyFrom ${files.join(' ')}`;
  try {
    const { stdout } = await exec(command);
    console.log(chalk.green(stdout));
  } catch (e) {
    console.error(chalk.red('\nThere is an error\n'));
    console.error(chalk.red(e.message));
    process.exit(1);
  }
}

executeTests();
