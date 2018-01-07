## Val

[](https://circleci.com/gh/pcsforeducation/val.svg?style=shield&circle-token=:circle-token)
[![styled with
prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

An chatbot for running my life. Based on Hubot, but with multiple simultaneous
adapters. Currently Alexa, Twilio, and Slack are supported.

Hosts the backend for a magic mirror and a recipe app currently. More to come soon :)

# Dev

    npm install -g watchify browserify

    npm start

# Docs

## Plugin

A simple boilerplate plugin is available at `plugins/pluginStarter.ts`.

### `hear()/respond()` patterns

When registering a callback for your plugin, you can specifiy the trigger as any time the bot sees the phrase (`hear()`) or only when the phrase is directed to the bot (`respond()`).
Both take one of three types of triggers: a regex, an exact string match, or a string with slots.

#### regex:

    robot.hear(/hello/, {}, (res: Response) => {
      res.send(res.envelope, "Hello there!");
    });

#### exact string:

    robot.hear("Hello", {}, (res: Response) => {
      res.send(res.envelope, "Hello there!");
    });

#### Choice slots

You can present a list of possible strings to match by separating them with a "|" inside the slot syntax. If you add a "|" as the last character, the match will be optional.

    // This will match "hello there", "hi there", "hello", and "hi"
    robot.hear("{hello|hi} {there|}", {}, (res: Response) => {
      res.send(res.envelope, "Hello there!");
    });

#### Typed slots

You can also match a few provided slot types:

    // This will match "what is the price of dogecoin" or "what is the price of BTC"
    robot.hear("what is the price of {:WORD}", {}, (res: Response) => {
      res.send(res.envelope, "Wow. Much sent! Such spend!");
    });

    // This will match "send 948 dogecoins"
    robot.hear("send {:NUMBER} dogecoins", {}, (res: Response) => {
      res.send(res.envelope, "Wow. Much sent! Such spend!");
    });

    // This will match "simon says Do A Barrel Roll"
    // Be careful, because this will likely match to the end of the string
    robot.hear("simon says {:MULTIWORD}", {}, (res: Response) => {
      res.send(res.envelope, "Wow. Much sent! Such spend!");
    });

## Async/Await Express

`Robot` contains a function to wrap `Robot.router` Express functions to make
them handle async/await correctly called `expressWrap()`. Simply wrap the
callback function you give to the router in this wrapper and you can use
async/await as you'd expect.

    async function hello() {
      return 'hello world~';
    }

    robot.router.get('/hello', robot.expressWrap(async (req) => {
      return await hello();
    }));

## Cron

`Robot` exposes a method `cron()` which allows you to have a function
executed on a schedule. This is easier to use than something like
`setTimeout`, because you can specify at which time (wall time, rather
than in X milliseconds) you want your function executed at. For example:

    // The function takes a name, a cron schedule, and callback.
    robot.cron('6am logging', '0 6 * * *', () => {console.log("It is 6am!")});

In this example, the console.log will happen at 6am every day. See [cron syntax](http://www.nncron.ru/help/EN/working/cron-format.htm) for more information on specifying a schedule.

The timezone will be whatever is specified via CRON_TIMEZONE in your config file or environment variables.
