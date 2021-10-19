var defaults = require("./wdio.conf.js");
var _ = require("lodash");

var overrides = {
  user: process.env.BROWSERSTACK_USERNAME || 'BROWSERSTACK_USERNAME',
  key: process.env.BROWSERSTACK_ACCESS_KEY || 'BROWSERSTACK_ACCESS_KEY',
  specs: [
    './src/test/suites/login/*.js',
    './src/test/suites/offers/*.js',
    './src/test/suites/product/*.js',
    './src/test/suites/e2e/*.js',
    './src/test/suites/user/*.js'
  ],
  host: 'hub.browserstack.com',
  commonCapabilities: {
    'browserstack.debug': true,
    'browserstack.video': true,
    'browserstack.networkLogs': true,
    acceptInsecureCerts: true,
    'browserstack.maskCommands':'setValues, getValues, setCookies, getCookies'
  },
  capabilities: [{
    maxInstances: 5,
    os: "OS X",
    os_version: "Catalina",
    browserName: 'Chrome',
    browser_version: "latest",
    name: (require('minimist')(process.argv.slice(2)))['bstack-session-name'] || 'default_name',
    build: process.env.BROWSERSTACK_BUILD_NAME || 'browserstack-examples-webdriverio' + " - " + new Date().getTime()
  }],
  afterTest: function (test, context, { error, result, duration, passed, retries }) {
    if((require('minimist')(process.argv.slice(2)))['bstack-session-name']) {
      browser.execute("browserstack_executor: {\"action\": \"setSessionName\", \"arguments\": {\"name\":\"" +
        (require('minimist')(process.argv.slice(2)))['bstack-session-name'] +  "\" }}");
    } else {
      browser.execute("browserstack_executor: {\"action\": \"setSessionName\", \"arguments\": {\"name\":\"" + test.title +  "\" }}");
    }

    if(passed) {
      browser.execute('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"passed","reason": "Assertions passed"}}');
    } else {
      browser.takeScreenshot();
      browser.execute('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "At least 1 assertion failed"}}');
    }
  }
};

exports.config = _.defaultsDeep(overrides, defaults.config);

exports.config.capabilities.forEach(function(caps){
  for(var i in exports.config.commonCapabilities) caps[i] = caps[i] || exports.config.commonCapabilities[i];
});