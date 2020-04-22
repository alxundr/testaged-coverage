'use strict';

const fetch = require('node-fetch');
const createRelease = require('./release');
const minimist = require('minimist');

jest.mock('chalk', () => {
  return {
    green: text => text,
    red: text => text,
  };
});

jest.mock('node-fetch');
jest.mock('minimist');
jest.mock('../package.json', () => {
  return {
    version: '1.0.0',
  };
});

describe('Release creation', () => {
  const log = jest.spyOn(console, 'log').mockImplementation(jest.fn);
  const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn);

  const assertExit = code => expect(exit.mock.calls[0][0]).toEqual(code);

  const assertExitOk = () => assertExit(0);
  const assertExitError = () => assertExit(1);

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test('throws error when latest release tag_name equals pkg.version', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        json() {
          return Promise.resolve({ tag_name: '1.0.0' });
        },
      })
    );
    await createRelease();
    expect(log).toHaveBeenCalledWith('version in package.json has not been updated');
    assertExitError();
  });

  test('throws error when body is not present', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        json() {
          return Promise.resolve({ tag_name: '0.1.0' });
        },
      })
    );

    minimist.mockReturnValue(() => ({ body: undefined }));

    await createRelease();
    expect(log).toHaveBeenCalledWith('arg body not specified');
    assertExitError();
  });

  test('shows success message after release is created', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        json() {
          return Promise.resolve({ tag_name: '0.1.0' });
        },
      })
    );

    minimist.mockImplementation(jest.fn(() => ({ body: 'test' })));
    await createRelease();
    expect(log).toHaveBeenCalledWith({ tag_name: '0.1.0' });
    assertExitOk();
  });
});
