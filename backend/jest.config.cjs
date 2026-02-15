/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+test.js"],
  collectCoverageFrom: ["routes/**/*.js", "middleware/**/*.js", "!**/node_modules/**"],
  coverageDirectory: "coverage",
  verbose: true,
  transform: { "^.+\\.js$": "babel-jest" },
  moduleNameMapper: {},
  testTimeout: 10000,
};
