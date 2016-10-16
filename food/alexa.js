'use strict';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const recipeModel = require('./recipeModel');
const userModel = require('./userModel');
var alexa = require('alexa-app');
var alexaApp = new alexa.app('recipes');
console.log("ALEXA APP", alexaApp)


// Increment should be 0 (repeat instruction) 1 (next) or -1 (previous)
function instructionAtIncrement(request, response, increment) {
  userModel.User.findOne({alexaId: request.userId}).then((user) => {
    recipeModel.Recipe.findById(user.lastRecipe).then((recipe) => {
      let index;
      if (!user.lastInstruction) {
        // Assume first instruction was done, may not be a good call
        index = 1;
      }
      else {
        index = user.lastInstruction + increment;
      }
      user.lastInstruction = index;
      let instruction = recipe.instructions[index];
      if (!instruction) {
        response.say("There are no more instructions. Do you want to start over?");
        // TODO...start over
        response.send();
        return;
      }
      user.save().then(() => {
        response.say("Step " + index + " is: " + instruction);
        response.send();
      });
    });
  });
  return false;
}

alexaApp.intent('ingredients', {
  "slots": {"Recipe": "Recipe"},
  "utterances": ["what are the ingredients in {-|Recipe}"]
}, function(request, response) {
  console.log("Intent: Ingredient");
  let recipeName = request.slot('Recipe');
  recipeModel.Recipe.findOne({name: /^Scrambled eggs$/i}).then(function(r) {
    recipeModel.Recipe.populate(r, {
      path: 'ingredients.food',
      populate: {path: 'food'}
    }).then(function(recipe) {
      console.log("Returning ingredients for ", recipe);
      if (!recipe) {
        response.say("Could not find recipe for " + recipeName);
        response.send();
        return;
      }
      let list = "";
// TODO: Fix these
// for (let ingredient of recipe.ingredients) {
//   list = list + ingredient.amount + " " + ingredient.unit + " " + ingredient.food.name + ", ";
//   console.log(list);
// }
      response.say("The ingredients in " + "recipe.name" + " are " + list);
      response.send();
      console.log("Sent");
    });
  }).catch((err) => {
    console.log("Error returning ingredients", err);
  });
// response.say("You asked for the number " + number);
  return false;
});

alexaApp.intent('calories', {
  "slots": {"Recipe": "Recipe"},
  "utterances": ["how many calories are in {-|Recipe}",
    "how many calories are in {a serving|one serving} of {-|Recipe}"]
}, function(request, response) {
  let recipeName = request.slot('Recipe');
  recipeModel.Recipe.findOne({name: /^Scrambled eggs$/i}).then(function(recipe) {
    if (!recipe) {
      response.say("Could not find recipe for " + recipeName);
      response.send();
      return;
    }
    console.log("Returning calories for recipe", recipe.name, recipe.calories / recipe.servings);
    response.say("There are " + (recipe.calories / recipe.servings).toFixed(0) + " calories in " + recipe.name);
    response.send();
  }).catch((err) => {
    console.log("Error getting calories", err);
  });
  return false;
});

alexaApp.intent('cost', {
  "slots": {"Recipe": "Recipe"},
  "utterances": ["how much does {-|Recipe} cost",
    "how much does {a serving|one serving} of {-|Recipe} cost"]
}, function(request, response) {
  let recipeName = request.slot('Recipe');
  recipeModel.Recipe.findOne({name: /^Scrambled eggs$/i}).then(function(recipe) {
    if (!recipe) {
      response.say("Could not find recipe for " + recipeName);
      response.send();
      return;
    }
    console.log("Returning cost for recipe", recipe.name, recipe.cost / recipe.servings);
    response.say(recipe.name + " costs $" + (recipe.cost / recipe.servings).toFixed(2) + " per serving");
    response.send();
  }).catch((err) => {
    console.log("Error getting calories", err);
  });
  return false;
});

alexaApp.intent('instructions', {
  "slots": {"Recipe": "Recipe"},
  "utterances": ["how do i make {-|Recipe}"]
}, function(request, response) {
  let recipeName = request.slot('Recipe');
  recipeModel.Recipe.findOne({name: /^Scrambled eggs$/i}).then(function(recipe) {
    if (!recipe) {
      response.say("Could not find recipe for " + recipeName);
      response.send();
      return;
    }
    console.log("Returning instructions for recipe", recipe.name, recipe.instructions);
    let i = 0;
    let instructions = "To make " + recipe.name + ", first, ";
    for (let instruction of recipe.instructions) {
      instructions = instructions + instruction;
      if (i <= recipe.instructions.length - 3) {
        instructions = instructions + ", then, ";
      }
      if (i == recipe.instructions.length - 2) {
        instructions = instructions + ", finally, ";
      }
      i = i + 1;
    }
    response.say(instructions);
    response.send();
  }).catch((err) => {
    console.log("Error getting calories", err);
  });
  return false;
});

alexaApp.intent('openRecipe', {
  "slots": {"Recipe": "Recipe"},
  "utterances": ["start cooking {-|Recipe}"]
}, function(request, response) {
  console.log("OPEN RECIPE");
  let recipeName = request.slot('Recipe');
  recipeModel.Recipe.findOne({name: /^Scrambled eggs$/i}).then(function(recipe) {
    if (!recipe) {
      response.say("Could not find recipe for " + recipeName);
      response.send();
      return;
    }
    else {
      console.log("Upserting", request.userId, recipe._id);
      userModel.User.findOneAndUpdate({alexaId: request.userId}, {
        $set: {
          lastRecipe: recipe._id,
          alexaId: request.userId
        }
      }, {upsert: true, new: true}).exec()
          .then((user) => {
            console.log("Upserted user", user);
            response.card({
              type: "Simple",
              title: recipe.name,
              content: "Ingredients:\n" + '1 cup of shit' + "\n\nInstructions:\n" + recipe.instructions.join('\n')
            });
            response.say("Ok. Let's make " + recipe.name + ". Do you want to hear the ingredients?");
            response.send();
          }).catch((err) => {
        console.log("Error upserting alexaId", err);
      });
    }
  });
  return false;
});

alexaApp.intent('cost', {
  "slots": {"Recipe": "Recipe"},
  "utterances": ["how much does {-|Recipe} cost",
    "how much does {a serving|one serving} of {-|Recipe} cost"]
}, function(request, response) {
  let recipeName = request.slot('Recipe');
  recipeModel.Recipe.findOne({name: /^Scrambled eggs$/i}).then(function(recipe) {
    if (!recipe) {
      response.say("Could not find recipe for " + recipeName);
      response.send();
      return;
    }
    console.log("Returning cost for recipe", recipe.name, recipe.cost / recipe.servings);
    response.say(recipe.name + " costs $" + (recipe.cost / recipe.servings).toFixed(2) + " per serving");
    response.send();
  }).catch((err) => {
    console.log("Error getting calories", err);
  });
  return false;
});

alexaApp.intent('nextInstruction', {
  "utterances": ["{what is|what's|what was} the next {instruction|step}",
    "what's next"]
}, function(request, response) {
  console.log("Next instruction");
  return instructionAtIncrement(request, response, 1);
});

alexaApp.intent('lastInstruction', {
  "utterances": ["{what is|what's|what was} the {previous} {instruction|step}",
    "what's was the last one"]
}, function(request, response) {
  console.log("Last instruction");
  return instructionAtIncrement(request, response, -1);
});

alexaApp.intent('repeatInstruction', {
  "utterances": ["{what is|what's|what wass} the {current|last} {instruction|step}",
    "{what was|repeat} {the instruction|the step|that}"]
}, function(request, response) {
  console.log("Repeat instruction");
  return instructionAtIncrement(request, response, 0);
});

module.exports = {
  routes: function(app) {
    app.use('/alexa/food', function(req, res) {
      alexaApp.request(req.body) // connect express to alexa-app
          .then(function(response) {
            res.json(response); // stream it to express' output
          });
    });
    app.get('/alexaschema/food', function (req, res) {
      let schema = alexaApp.schema();
      let utterances = alexaApp.utterances();
      console.log(schema);
      console.log(utterances);
      res.send("Check the console")
    });

    return app;
  }
};
