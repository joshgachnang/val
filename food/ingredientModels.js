'use strict';
const mongoose = require('mongoose');
const _ = require('underscore');
const math = require('mathjs');
const pluralize = require('pluralize');
const UNITS = {
    POUND: 'pound',
    OUNCE: 'ounce',
    FLUID_OUNCE: 'fluid ounce',
    GRAM: 'gram',
    CUP: 'cup',
    TABLESPOON: 'tablespoon',
    TEASPOON: 'teaspoon',
    EACH: 'each',
    PINCH: 'pinch',
    MILLILITER: 'milliliter'
};
const unitEnum = _.values(UNITS);
var ingredientSchema = new mongoose.Schema({
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    amount: { type: Number, required: true },
    unit: { type: String, required: true, enum: unitEnum },
    conversionFactor: Number
});
var recipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameLower: String,
    ingredients: [ingredientSchema],
    instructions: [String],
    calories: Number,
    cost: Number,
    servings: { type: Number, default: 1 }
});
recipeSchema.pre('save', function (next) {
    this.lowerName = this.name.toLowerCase();
    next();
});
recipeSchema.statics.calculateTotals = function (recipe) {
    recipe.calories = 0;
    recipe.cost = 0;
    let conversionFactor;
    recipe.ingredients.forEach((ingredient) => {
        if (ingredient.unit === 'each') {
            let foodServingSize;
            if (ingredient.food.servingSizeUnit === 'each') {
                foodServingSize = ingredient.food.servingSize;
            }
            else if (ingredient.food.servingSizeUnit2 === 'each') {
                foodServingSize = ingredient.food.servingSize2;
            }
            else {
                console.log("Could not convert each when no other serving sizes in each");
                return;
            }
            conversionFactor = ingredient.amount / foodServingSize;
            ingredient.conversionFactor = conversionFactor;
        }
        else {
            // let conversionString = `${ingredient.food.servingSize} ${ingredient.food.servingSizeUnit} / ${ingredient.amount} ${ingredient.unit}`;
            let r;
            let i = math.unit(ingredient.amount, ingredient.unit);
            try {
                r = math.unit(ingredient.food.servingSize, ingredient.food.servingSizeUnit);
                conversionFactor = math.divide(i, r);
            }
            catch (err) {
                r = math.unit(ingredient.food.servingSize2, ingredient.food.servingSizeUnit2);
                conversionFactor = math.divide(i, r);
            }
            ingredient.conversionFactor = conversionFactor;
        }
        console.log('adding cost/cals for ingredient', ingredient);
        // TODO unit conversion
        console.log("CALS", recipe.calories, ingredient.food.calories, ingredient.amount);
        recipe.calories = recipe.calories + (ingredient.food.calories *
            conversionFactor);
        console.log("COST", recipe.cost, ingredient.food.cost, ingredient.amount);
        recipe.cost = recipe.cost + (ingredient.food.cost * conversionFactor);
    });
    console.log('calculated', recipe.calories, 'calories, cost: ', recipe.cost);
    return recipe.save();
};
// Return a string representation suitable for Alexa to speak
recipeSchema.statics.voicePrint = function (index) {
    let ingredient = this.ingredients[index];
    if (ingredient) {
        if (ingredient.unit == "each") {
            return ingredient.amount + " " + ingredient.food.name;
        }
        else {
            return ingredient.amount + " " + pluralize(ingredient.unit, ingredient.amount) + " of " +
                ingredient.food.name;
        }
    }
    else {
        return "There are no more instructions. Do you want to start over?";
    }
};
//# sourceMappingURL=ingredientModels.js.map