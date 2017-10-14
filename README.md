Val
----

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

## Plugin start

A simple boilerplate plugin is available at `plugins/pluginStarter.ts`.

## Async/Await Express

`Robot` contains a function to wrap `Robot.router` Express functions to make
them handle async/await correctly called `expressWrap()`. Simply wrap the
callback function you give to the router in this wrapper and you can use
async/await as you'd expect.

```
    async function hello() {
      return 'hello world~';
    }

    robot.router.get('/hello', robot.expressWrap(async (req) => {
      return await hello();
    }));
```

Icon
----
cook-male* are downloaded from https://icons8.com/web-app/6112/cook-male. I have a paid license.
