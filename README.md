# testaged-coverage &middot; ![Node.js CI](https://github.com/alxundr/testaged-coverage/workflows/Node.js%20CI/badge.svg?branch=master) &middot; ![Node.js Package](https://github.com/alxundr/testaged-coverage/workflows/Node.js%20Package/badge.svg?branch=1.1.4&event=release)

Use this library to execute tests on your git staged files and verify they comply with the test coverage threshold.

### You can install this dependency globally now (starting 1.3.3)
`yarn add global testaged-coverage` or

`npm install testaged-coverage -g`.

Before the tests are run, make sure you have set a **Jest** "coverageThreshold". You can learn how to configure it [here](https://jestjs.io/docs/en/configuration#coveragethreshold-object).

```js
// package.json
{
  ...
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## How to use it

You need to stage your files first with `git add`.

### In a pre-commit hook

You will need to have [husky](https://github.com/typicode/husky) installed.
In your `package.json`, add the script to run as a pre-commit hook.

```js
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "testaged-coverage && <you can include other scripts here (e.g. lint-staged)>"
    }
  },
}
```

### Directly in command line

Just execute `testaged-coverage`

Starting **1.3.0** you can add a **--basedir** array of folders where to look for tests

```js
testaged-coverage --basedir="src scripts folder1 folder2"
```

By default --basedir is folder `src`

## Troubleshooting

This library assumes you have a script setup for tests in your `package.json`.

```js
// package.json
{
  "scripts": {
    "test": "jest"
  },
}
```

If you are using `react-scripts test`, you need to add the environment variable `CI=true` to prevent the script from running in watch mode.
