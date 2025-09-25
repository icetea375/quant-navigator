module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.(spec|test|entity|simple)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../backend/src/**/*.(t|j)s',
    '../frontend/src/**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.test.ts',
  ],
  coverageDirectory: './reports/coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/config/test-setup.ts'],
  globalTeardown: '<rootDir>/config/test-teardown.ts',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../aigc/backend/src/$1',
    '^@frontend/(.*)$': '<rootDir>/../frontend/src/$1',
  },
  modulePaths: ['<rootDir>/../aigc/backend/node_modules'],
};