'use strict';
const mongoose = require('mongoose');
const _ = require('underscore');
const math = require('mathjs');
const pluralize = require('pluralize');
const imgur = require('./imgur');

const config = require('../utils').config;
const units = require('./js/units');
const unitEnum = units.unitsEnum;


var ingredientSchema = new mongoose.Schema({
  food: {type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true},
  amount: {type: Number, required: true},
  unit: {type: String, required: true, enum: unitEnum},
  conversionFactor: Number
});

ingredientSchema.methods.print = function() {
  let formattedAmount = "";
  if (this.unit == "each") {
    formattedAmount = this.amount;
  } else {
    formattedAmount = this.amount + " " + pluralize(this.unit, this.amount);
  }
  return formattedAmount + " " + this.food.name;
};

var recipeSchema = new mongoose.Schema({
  name: {type: String, required: true},
  nameLower: String,
  description: String,
  ingredients: [ingredientSchema],
  instructions: [String],
  calories: Number,
  cost: Number,
  servings: {type: Number, default: 1},
  prepTime: {type: Number, require: true},
  cookTime: {type: Number, require: true},
  readyTime: {type: Number, require: true},
  imgurAlbum: String,
  imgurImages: [String], // Imgur image ids
  imgurDeleteHash: String,
  images: [String] // Image filenames in uploads/
});

recipeSchema.pre('save', function(next) {
  this.lowerName = this.name.toLowerCase();
  if (this.images && this.images.length > 0 && !this.imgurAlbum) {
    let title = this.name;
    console.log("images", this.images);

    imgurDescription(this).then((description) => {
      console.log("Creating imgur album", this.images);
      let imagePaths = _.map(this.images, (image) => {
        return "uploads/" + image;
      });
      return createImgurAlbum(imagePaths, "File", title, description)
          .then((response) => {
            console.log("Imgur Album creation response: ", response);
            this.imgurAlbum = response.id;
            this.imgurDeleteHash = response.deletehash;
            this.images = [];
            this.imgurImages = _.map(response.images, (image) => {
              return image.id;
            });
            return this.save();
          }).then(() => {
            return next();
          })
    });
  } else {
    next();
  }
});

// TODO: http://stackoverflow.com/questions/37006974/typescript-static-methods-for-mongoose-schemas
// TODO: https://github.com/vagarenko/mongoose-typescript-definitions/issues/4
function calculateTotals(recipe) {
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
  // return recipe.save()
}

// Return a string representation suitable for Alexa to speak
function voicePrint(index) {
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
}

function createImgurAlbum(images, imageType, title, description) {
  if (!imageType) {
    imageType = 'Base64';
  }

  imgur.setCredentials(config.IMGUR_EMAIL, config.IMGUR_PASSWORD, config.IMGUR_CLIENT_ID);
  return imgur.createAlbum({title: title, description: description})
            .then(function(album) {
              console.log("Album created:", album);
              return imgur.uploadImages(images, imageType, album.data.id)
                  .then(function(images) {
                    console.log("Uploaded images to album", album, images);
                    return {album: album.data, images: images};
                  })
            })
            .catch(function(err) {
              console.error(err.message);
              return error.message;
            });
}

let Recipe = mongoose.model("Recipe", recipeSchema);

function imgurDescription(recipe) {
  console.log("populating recipe", recipe);
  return Recipe.populate(recipe, {
    path: 'ingredients.food',
    populate: {path: 'food', model: 'Food'}
  }).then((r) => {
    console.log("Found recipe", r);

    let description = r.name + "\n" + "http://life.nang.in/#/recipes/" + r._id + "\n\n";

    description += "Ingredients:\n------------\n";

    for (let ingredient of r.ingredients) {
      description += ingredient.print() + "\n";
    }

    description += "\n\nInstructions:\n-------------\n";

    let i = 1;
    for (let instruction of r.instructions) {
      description += i + ". " + instruction + "\n";
      i++;
    }

     console.log("Imgur description", description);
    return description;
  });
}

exports.voicePrint = voicePrint;
exports.Recipe = Recipe;
exports.Ingredient = mongoose.model("Ingredient", ingredientSchema);
exports.calculateTotals = calculateTotals;
exports.createImgurAlbum = createImgurAlbum;
exports.imgurDescription = imgurDescription;
