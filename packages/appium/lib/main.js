#!/usr/bin/env node
// transpile:main

import { init as logsinkInit } from './logsink';
import logger from './logger'; // logger needs to remain first of imports
import _ from 'lodash';
import { default as baseServer } from 'appium-express';
import { asyncify } from 'asyncbox';
import getParser from './parser';
import { showConfig, checkNodeOk, validateServerArgs,
         warnNodeDeprecations, validateTmpDir, getNonDefaultArgs,
         getDeprecatedArgs, getGitRev, APPIUM_VER } from './config';
import getAppiumRouter from './appium';
import registerNode from './grid-register';


async function preflightChecks (parser, args) {
  try {
    checkNodeOk();
    if (args.asyncTrace) {
      require('longjohn').async_trace_limit = -1;
    }
    if (args.showConfig) {
      await showConfig();
      process.exit(0);
    }
    warnNodeDeprecations();
    validateServerArgs(parser, args);
    if (args.tmpDir) {
      await validateTmpDir(args.tmpDir);
    }
  } catch (err) {
    logger.error(err.message.red);
    process.exit(1);
  }
}

function logDeprecationWarning (deprecatedArgs) {
  logger.warn('Deprecated server args:');
  for (let [arg, realArg] of _.pairs(deprecatedArgs)) {
    logger.warn(`    ${arg.red} => ${realArg}`);
  }
}

async function logStartupInfo (parser, args) {
  let welcome = `Welcome to Appium v${APPIUM_VER}`;
  let appiumRev = await getGitRev();
  if (appiumRev) {
    welcome += ` (REV ${appiumRev})`;
  }
  logger.info(welcome);
  let logMessage = `Appium REST http interface listener started on ` +
                   `${args.address}:${args.port}`;
  logger.info(logMessage);
  let showArgs = getNonDefaultArgs(parser, args);
  if (_.size(showArgs)) {
    logger.info(`Non-default server args:`);
    for (let [arg, value] of _.pairs(showArgs)) {
      logger.info(`    ${arg.red}: ${value}`);
    }
  }
  let deprecatedArgs = getDeprecatedArgs(parser, args);
  if (_.size(deprecatedArgs)) {
    logDeprecationWarning(deprecatedArgs);
  }
  if (!_.isEmpty(args.defaultCapabilities)) {
    logger.info(`Default capabilities, which will be added to each request ` +
                `unless overridden by desired capabilities: ` +
                `${JSON.stringify(args.defaultCapabilities)}`);
  }
  // TODO: bring back loglevel reporting below once logger is flushed out
  //logger.info('Console LogLevel: ' + logger.transports.console.level);
  //if (logger.transports.file) {
    //logger.info('File LogLevel: ' + logger.transports.file.level);
  //}
}

async function main (args = null) {
  let parser = getParser();
  if (!args) {
    args = parser.parseArgs();
  }
  await logsinkInit(args);
  await preflightChecks(parser, args);
  let router = getAppiumRouter(args);
  let server = await baseServer(router, args.port, args.address);
  try {
    // TODO prelaunch if args.launch is set
    // TODO: startAlertSocket(server, appiumServer);

    // configure as node on grid, if necessary
    if (args.nodeconfig !== null) {
      await registerNode(args.nodeconfig, args.address, args.port);
    }

    await logStartupInfo(parser, args);
  } catch (err) {
    server.close();
    throw err;
  }
  return server;
}

if (require.main === module) {
  asyncify(main);
}

export { main };
