module.exports = {
  testPathIgnorePatterns: [`node_modules`, `\\.bin`],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  collectCoverageFrom: ['src/**/*.js', '!src/testaged-coverage.js'],
};
