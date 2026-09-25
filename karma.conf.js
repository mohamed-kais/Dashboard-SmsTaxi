// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

// `ng test --code-coverage` injects a reporter named "coverage", but only
// `karma-coverage-istanbul-reporter` (registers "coverage-istanbul") is
// installed (`karma-coverage` is not, and npm install is out of scope).
// Alias the installed reporter under the name the Angular builder expects.
const istanbulReporterModule = require('karma-coverage-istanbul-reporter');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      { 'reporter:coverage': istanbulReporterModule['reporter:coverage-istanbul'] },
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/skote'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    // Headless by default (works in CI). `ChromeHeadlessNoSandbox` is the
    // fallback for root/container environments where --no-sandbox is required;
    // override per-run with `--browsers=...`.
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
