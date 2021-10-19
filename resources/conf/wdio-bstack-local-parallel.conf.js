var defaults = require("./wdio.conf.js");
var browserstack = require('browserstack-local');
var _ = require("lodash");

timeStamp = new Date().getTime();

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
  hostname: 'hub.browserstack.com',
  baseUrl: 'http://localhost:3000/',
  waitforTimeout: 50000,
  maskCommands: 'setValues, getValues, setCookies, getCookies',
  commonCapabilities: {
    'browserstack.debug': true,
    'browserstack.video': true,
    'browserstack.networkLogs': true,
    'browserstack.local': true,
    acceptInsecureCerts: true,
    "browserstack.localIdentifier": timeStamp,
  },
  capabilities: [{
    maxInstances: 5,
    'browserstack.maskCommands':'setValues, getValues, setCookies, getCookies',
    'browserstack.debug': true,
    'browserstack.video': true,
    os: "OS X",
    os_version: "Catalina",
    browserName: 'Chrome',
    browser_version: "latest",
    acceptInsecureCerts: true,
    name: (require('minimist')(process.argv.slice(2)))['bstack-session-name'] || 'default_name',
    build: process.env.BROWSERSTACK_BUILD_NAME || 'browserstack-examples-webdriverio' + " - " + new Date().getTime()
  }],
  onPrepare: function (config, capabilities) {
    console.log("Connecting local");
    return new Promise(function (resolve, reject) {
      exports.bs_local = new browserstack.Local();
      exports.bs_local.start({ 'key': exports.config.key, 'localIdentifier': timeStamp }, function (error) {
        if (error) return reject(error);

        console.log('Connected. Now testing...');
        resolve();
      });
    });
  },
  onComplete: function (capabilties, specs) {
    return new Promise(function(resolve, reject){
      exports.bs_local.stop(function() {
        console.log("Binary stopped");
        resolve();
      });
    });
  },
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
