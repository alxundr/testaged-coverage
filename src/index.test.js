'use strict';

const minimist = require('minimist');

jest.mock('minimist');

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
  const spawn = jest.spyOn(require('child_process'), 'spawn');
  const stagedFiles = [
    'src/components/Layout.js',
    'src/components/Layout.test.js',
    'src/App.tsx',
    'src/__tests__/App.test.tsx',
    'src/Hero.test.jsx',
    'other-script.js',
    'scripts/bin.js',
    'scripts/bin.test.js',
    'other-folder/foo.js',
    'other-folder/__tests__/foo.js',
    'ignored-folder/ignored.js',
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

  const spawnMock = (exitCode = 0) => {
    require('child_process').spawn.mockImplementation(() => ({
      on(arg, callback) {
        callback(exitCode);
      },
    }));
  };

  const assertExit = code => expect(exit.mock.calls[0][0]).toEqual(code);

  const assertExitOk = () => assertExit(0);
  const assertExitError = () => assertExit(1);

  beforeEach(() => {
    require('child_process').exec.mockImplementation(execMock);
    minimist.mockReturnValue({ basedir: undefined });
    spawnMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    expect(spawn).toHaveBeenCalledWith(
      'npm',
      [
        'run',
        'test',
        '--',
        '--findRelatedTests',
        'src/components/Layout.js',
        'src/App.tsx',
        'src/Hero.jsx',
        '--coverage',
        '--collectCoverageOnlyFrom',
        'src/components/Layout.js',
        'src/App.tsx',
        'src/Hero.jsx',
        '--passWithNoTests',
      ],
      {
        stdio: 'inherit',
      }
    );
    assertExitOk();
  });

  test('includes files from basedir from args', async () => {
    minimist.mockReturnValue({ basedir: 'src scripts other-folder' });
    await executeTests();
    expect(spawn).toHaveBeenCalledWith(
      'npm',
      [
        'run',
        'test',
        '--',
        '--findRelatedTests',
        'src/components/Layout.js',
        'src/App.tsx',
        'src/Hero.jsx',
        'scripts/bin.js',
        'other-folder/foo.js',
        '--coverage',
        '--collectCoverageOnlyFrom',
        'src/components/Layout.js',
        'src/App.tsx',
        'src/Hero.jsx',
        'scripts/bin.js',
        'other-folder/foo.js',
        '--passWithNoTests',
      ],
      {
        stdio: 'inherit',
      }
    );
    assertExitOk();
  });

  test('throws error when does not meet coverage', async () => {
    spawnMock(1);
    await executeTests();
    assertExitError();
  });

  test('executes npm.cmd for win platform', async () => {
    minimist.mockReturnValue({ basedir: 'src scripts other-folder' });
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      writeable: false,
    });
    await executeTests();
    expect(spawn).toHaveBeenCalledWith(
      'npm.cmd',
      [
        'run',
        'test',
        '--',
        '--findRelatedTests',
        'src/components/Layout.js',
        'src/App.tsx',
        'src/Hero.jsx',
        'scripts/bin.js',
        'other-folder/foo.js',
        '--coverage',
        '--collectCoverageOnlyFrom',
        'src/components/Layout.js',
        'src/App.tsx',
        'src/Hero.jsx',
        'scripts/bin.js',
        'other-folder/foo.js',
        '--passWithNoTests',
      ],
      {
        stdio: 'inherit',
      }
    );
    assertExitOk();
  });
});
