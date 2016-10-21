"use strict";

const exec = require('child_process').exec;

module.exports = function (bot) {

  function deploy(message) {
    let deployCommand = bot.config.plugins.DEPLOY.DEPLOY_COMMAND;
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
