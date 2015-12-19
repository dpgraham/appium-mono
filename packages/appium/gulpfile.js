"use strict";

var gulp = require('gulp'),
    boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp),
    path = require('path'),
    fs = require('fs');

boilerplate({
  build: 'appium',
  jscs: false,
  test: {
    files: ['${testDir}/**/*-specs.js']
  },
});

// generates server arguments readme
gulp.task('docs', ['transpile'], function () {
  var parser = require('./build/lib/parser.js');
  var appiumArguments = parser.getParser().rawArgs;
  var docFile = path.resolve(__dirname, "docs/en/writing-running-appium/server-args.md");
  var md = "# Appium server arguments\n\n";
  md += "Many Appium 1.5 server arguments have been deprecated in favor of the "
  md += "[--default-capabilities flag](/docs/en/writing-running-appium/default-capabilities-arg.md)."
  md += "\n\nUsage: `node . [flags]`\n\n";
  md += "## Server flags\n";
  md += "All flags are optional, but some are required in conjunction with " +
        "certain others.\n\n";
  md += "\n\n<expand_table>\n\n";
  md += "|Flag|Default|Description|Example|\n";
  md += "|----|-------|-----------|-------|\n";
  appiumArguments.forEach(function (arg) {
    var argNames = arg[0];
    var exampleArg = typeof arg[0][1] === "undefined" ? arg[0][0] : arg[0][1];
    var argOpts = arg[1];

    // --keystore-path defaultValue contains a user-specific path,
    // let's replace it with <user>/...
    if (arg[0][0] === '--keystore-path') {
      var userPath = process.env.HOME || process.env.USERPROFILE;
      argOpts.defaultValue = argOpts.defaultValue.replace(userPath, '&lt;user&gt;')
    }

    // handle empty objects
    if (JSON.stringify(argOpts.defaultValue) === '{}'){
      argOpts.defaultValue = '{}';
    }

    md += "|`" + argNames.join("`, `") + "`";
    md += "|" + ((typeof argOpts.defaultValue === "undefined") ? "" : argOpts.defaultValue);
    md += "|" + argOpts.help;
    md += "|" + ((typeof argOpts.example === "undefined") ? "" : "`" + exampleArg + " " + argOpts.example + "`");
    md += "|\n";
  });
  // console.log(md);
  fs.writeFile(docFile, md, function (err) {
    if (err) {
      console.log(err.stack);
    } else {
      console.log("New docs written! Don't forget to commit and push");
    }
  });
});
