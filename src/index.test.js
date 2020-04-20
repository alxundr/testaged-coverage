'use strict';

jest.mock('util', () => {
  return {
    promisify: fn => fn,
  };
});
jest.mock('child_process');
jest.mock('chalk', () => {
  return {
    green: text => text,
    red: text => text,
    yellow: text => text,
  };
});
const { executeTests } = require('./index');

describe('Binary execution', () => {
  const log = jest.spyOn(console, 'log').mockImplementation(jest.fn);
  const logError = jest.spyOn(console, 'error').mockImplementation(jest.fn);
  const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn);
  const exec = jest.spyOn(require('child_process'), 'exec');
  const stagedFiles = [
    'src/components/Layout.js',
    'src/components/Layout.test.js',
    'src/App.tsx',
    'src/__tests__/App.test.tsx',
    'src/Hero.test.jsx',
    'other-script.js',
  ];

  const execMock = command => {
    switch (command) {
      case 'git diff --name-only --cached':
        return Promise.resolve({ stdout: stagedFiles.join('\n') });
      case 'npx jest --showConfig':
        return Promise.resolve({ stdout: JSON.stringify({ globalConfig: { coverageThreshold: {} } }) });
      default:
        return Promise.resolve({ stdout: '' });
    }
  };

  const setupExecMock = command => (overrideComand, stdout) => {
    if (command === overrideComand) {
      return Promise.resolve({ stdout });
    }
    return execMock(command);
  };

  const assertExit = code => expect(exit.mock.calls[0][0]).toEqual(code);

  const assertExitOk = () => assertExit(0);
  const assertExitError = () => assertExit(1);

  beforeEach(() => {
    require('child_process').exec.mockImplementation(execMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test('logs error when coverageThreshold is not found', async () => {
    require('child_process').exec.mockImplementation(command =>
      setupExecMock(command)('npx jest --showConfig', JSON.stringify({ globalConfig: {} }))
    );
    await executeTests();
    expect(logError).toHaveBeenCalledWith('\ncoverageThreshold not found!\n');
    assertExitError();
  });

  test('does not execute test when there is no file staged', async () => {
    require('child_process').exec.mockImplementation(command => setupExecMock(command)('git diff --name-only --cached', ''));
    await executeTests();
    expect(log).toHaveBeenCalledWith('\nNo tests matched!\n');
    assertExitOk();
  });

  test('filters spec and test files from staged tests', async () => {
    await executeTests();
    expect(exec).toHaveBeenCalledWith(
      'npm run test -- --findRelatedTests src/components/Layout.js src/App.tsx src/Hero.jsx --coverage --collectCoverageOnlyFrom src/components/Layout.js src/App.tsx src/Hero.jsx'
    );
    assertExitOk();
  });

  test('throws error when does not meet coverage', async () => {
    require('child_process').exec.mockImplementation(command => {
      if (command.startsWith('npm run test')) {
        return Promise.reject(new Error('error message'));
      }
      return execMock(command);
    });
    await executeTests();
    expect(logError).toHaveBeenCalledWith('\nThere is an error\n');
    expect(logError).toHaveBeenCalledWith('error message');
    assertExitError();
  });
});
