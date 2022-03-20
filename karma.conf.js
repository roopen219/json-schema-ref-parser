// Karma config
// https://karma-runner.github.io/0.12/config/configuration-file.html
// https://jstools.dev/karma-config/

const { karmaConfig } = require('@jsdevtools/karma-config');
const { host } = require('@jsdevtools/host-environment');

module.exports = karmaConfig({
  sourceDir: 'lib',
  fixtures: 'test/fixtures/**/*.js',
  browsers: {
    chrome: true,
    firefox: true,
    safari: host.os.mac,
    edge: false,
    ie: false,
  },
});
