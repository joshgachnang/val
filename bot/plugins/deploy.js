// Description:
//    Run preconfigured deploy commands
//
// Dependencies:
//    None
//
// Configuration:
//    DEPLOY_COMMANDS: A dictionary of keys that represent commands, with values of dictionaries
//      with the following required keys:
//      command: The bash command to run
//      args: Any args to pass to the command. Note: additional args will be appended if there are
//        are excess args, such as `deploy $commandName $extraArg1 $extraArg2`. The args passed to
//        command will be the `$args $extraArg1 $extraArg2`
//      Optional args:
//      cwd: The directory to run $command from. Defaults to the current directory
//      env: An array of environment variables to pass to $command. Defaults to none.
//      allowedUsers: Array of user names allowed to run this command. Defaults to any user.
//      Note: The command key 'default' will be run if the user does not specify a command
//
// Commands:
//   hubot deploy - Deploys 'default' in DEPLOY_COMMANDS
//   hubot deploy staging - Deploys 'staging' in DEPLOY_COMMANDS
//   hubot deploy staging version:v1.0.0 - Deploys 'staging' in DEPLOY_COMMANDS and adds 'version:v1.0.0' to the end of the command args.
//
// Author:
//   pcsforeducation

"use strict";

const spawn = require('child_process').spawn;

module.exports = function (bot) {

  function deploy(response) {
    console.log(response);
    let logger = response.bot.logger;

    let DEPLOY = bot.config.plugins.DEPLOY.COMMANDS;
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
      shell: '/bin/bash',
      timeout: 0,
      cwd: deployCommand.cwd,
      env: deployCommand.env
    };

    let args = deployCommand.args;
    if (!Array.isArray(args)) {
      args = [args];
    }

    // Append any extra args
    args = args.concat(extraArgs.split(" "));

    // Check if the user is allowed to run it
    if (deployCommand.allowedUsers &&
        deployCommand.allowedUsers.indexOf(response.envelope.user.name) === -1) {
      bot.send(response.envelope, "Sorry, you're not allowed to run that command");
      return
    }

    logger.debug(`deploying command: ${deployCommand.command} args: ${args} options: ${commandOptions}`);
    bot.send(response.envelope, "Beginning bot deploy...");

    try {
      process = spawn(deployCommand.command, args, commandOptions);
    } catch (error) {
      bot.send(response.envelope, `Error starting deploy process: ${error}`);
    }

    process.stdout.on('data', function(data) {
      bot.send(response.envelope, `${data.toString()}`);
    });

    process.stderr.on('data', function(data) {
      bot.send(response.envelope, `Error: ${data.toString()}`);
    });

    process.on('exit', function(code) {
      bot.send(response.envelope, `Deploy process exited with code ${code.toString()}`);
    });
  }

  // Register the hear handler
  bot.respond(/deploy\s*(.*)/i, deploy);
};
