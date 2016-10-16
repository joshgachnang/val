'use strict';
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const models = require('./models');
// Config
var mongoHost = process.env.DB_HOST || 'mongodb://localhost/food';
mongoose.connect(mongoHost);
function fixFood() {
    models.Food.find().then((foods) => {
        let promises = [];
        for (let food of foods) {
            promises.push(food.save());
        }
        Promise.all(promises).then((saved) => {
            console.log('All food saved, count:', saved.length);
            // fixRecipes();
        }).catch((err) => {
            console.log('Error saving food', err);
        });
    });
}
function fixRecipes() {
    models.Recipe.find().then((recipes) => {
        let promises = [];
        for (let recipe of recipes) {
            promises.push(models.Recipe.populate(recipe, {
                path: 'ingredients.food',
                populate: { path: 'food' }
            }).then((r) => {
                return models.Recipe.calculateTotals(r).then(() => {
                    return recipe.save();
                });
            }).catch((err) => {
                console.log("CAUGHT ERR", err.stack);
            }));
        }
        Promise.all(promises).then(() => {
            console.log('All recipes saved');
            process.exit();
        }).catch((err) => {
            console.log('Error saving recipe', err.stack);
        });
    });
}
console.log(process.argv.length, process.argv[3], process.argv[2]);
// process.exit(1)
if (process.argv.length === 4) {
    // console.log("HERE")
    // process.exit(1)
    if (process.argv[2] == "--food") {
        models.Food.findById(process.argv[3]).then((food) => {
            return food.save();
        }).then(() => {
            process.exit(0);
        });
    }
    else if (process.argv[2] == "--recipe") {
        models.Recipe.findById(process.argv[3]).then((recipe) => {
            models.Recipe.populate(recipe, {
                path: 'ingredients.food',
                populate: { path: 'food' }
            }).then((r) => {
                return models.Recipe.calculateTotals(r).then(() => {
                    return recipe.save();
                }).then(() => {
                    process.exit(0);
                });
            }).catch((err) => {
                console.log("CAUGHT ERR", err.stack);
            });
        });
    }
    else {
        console.log("Usage: node fix.js [--food|--recipe <id>]");
        process.exit(-1);
    }
}
fixFood();
