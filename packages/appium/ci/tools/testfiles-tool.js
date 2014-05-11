'use strict';

var args = process.argv.slice(2),
    _ = require('underscore'),
    glob = require('glob'),
    fs = require('fs');

var action = args[0];

function split() {
  var globPattern = args[1];
  var blackList = _((args[2] || "").split(',')).map(function(filename) {
    return filename.trim();
  });

  var groups = {};
  _(5).times(function(i) { groups['group ' + (i + 1)] = []; });
  glob(globPattern, function (err, files) {
    files = _(files).reject(function(filename) {
      return blackList.indexOf(filename) >= 0;
    });
    _(files).each(function(filename, i) { 
      groups['group ' + ((i % 5) + 1)].push(filename);
    });
    console.log(JSON.stringify(groups, null, 2));
  });  
}

function list() {
  var splitData = JSON.parse(fs.readFileSync(args[1], 'utf8'));
  var group = args[2];
  console.log(splitData[group].join(' '));
}

switch(action) {
  case 'split':
    return split();
  case 'list':
    return list();
  default:
    console.log("Invalid action");
    process.exit(1);
}