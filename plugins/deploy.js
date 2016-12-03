"use strict";

const exec = require('child_process').exec;

module.exports = function (bot) {
  
  function deploy(response) {
    console.log(response);
    let logger = response.bot.logger;

    let DEPLOY = bot.config.plugins.DEPLOY_COMMANDS;
    console.log("DEPLOY", DEPLOY)
    let deployCommand;
    let commandName;
    let extraArgs = "";

    let process;

    // Parse args
    let deployArgs = response.match[1];
    if (deployArgs) {
      commandName = deployArgs.split(" ")[0];
      deployCommand = DEPLOY[commandName];
      extraArgs = deployArgs.split(" ").slice(1).join(" ");
    } else {
      commandName = "default";
      deployCommand = DEPLOY.default;
    }
    logger.debug("Deploy command args:", deployCommand, extraArgs);

    if (!deployCommand) {
      logger.error("Could not find a deploy command ${commandName}");
      bot.send(response.envelope, "Could not find a deploy command ${commandName}");
      return;
    }

    let commandOptions = {
      encoding: 'utf8',
      shell: '/bin/bash',
      timeout: 0,
      maxBuffer: 20000*1024,
      cwd: null,
      env: null
    };
    console.log("deploying", message, "command: ", deployCommand);
    bot.send(message.envelope, "Beginning bot deploy...");
    exec(deployCommand, commandOptions, (error, stdout, stderr) => {
      if (error) {
        bot.send(message.envelope, `exec error: ${error}`);
        return;
      }
      if (stdout) {
        bot.send(message.envelope, `stdout: ${stdout}`);
      }
      if (stderr) {
        bot.send(message.envelope, `stderr: ${stderr}`);
      }
      bot.send(message.envelope, `deploy finished`);
    });
  }

  // Register the hear handler
  bot.respond(/deploy/i, deploy);
};
