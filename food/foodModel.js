'use strict';
const mongoose = require('mongoose');
const _ = require('underscore');
const pluralize = require('pluralize');
const units = require('./js/units');


var nutritionSchema = new mongoose.Schema({
  totalFat: Number, // g
  saturatedFat: Number, // g
  cholesterol: Number, // mg
  sodium: Number, // mg
  totalCarbohydrates: Number, // g
  protein: Number
});

var foodSchema = new mongoose.Schema({
  name: {type: String, required: true},
  nameLower: String,
  servingSize: {type: Number, required: true},
  servingSizeUnit: {type: String, required: true, enum: units.unitEnum},
  servingSize2: {type: Number},
  servingSizeUnit2: {type: String, enum: units.unitEnum},
  amazonUrl: String,
  amazonPrice: Number,
  amazonServingsPerContainer: Number,
  targetUrl: String,
  targetPrice: Number,
  targetServingsPerContainer: Number,
  costcoUrl: String,
  costcoPrice: Number,
  costcoServingsPerContainer: Number,
  calories: Number,
  cost: Number,
  nutrition: nutritionSchema,
  tags: [{
    name: String,
    generated: {type: Boolean, default: false}
  }]
});

foodSchema.methods.calculateCost = function() {
  let costs = {
    amazon: this.amazonPrice / this.amazonServingsPerContainer,
    target: this.targetPrice / this.targetServingsPerContainer,
    costco: this.costcoPrice / this.costcoServingsPerContainer
  };
  console.log("amazon", this.amazonPrice, this.amazonServingsPerContainer);
  console.log("target", this.targetPrice, this.targetServingsPerContainer);
  console.log("costco", this.costcoPrice, this.costcoServingsPerContainer);
  let allCosts = _.filter(_.values(costs), (cost) => {
    return cost !== undefined && !isNaN(cost);
  });
  let cost = _.min(allCosts);
  if (cost) {
    this.cost = cost;
  }
};

foodSchema.pre('save', function(next) {
  this.lowerName = this.name.toLowerCase();
// Remove all the generated tags, and regenerate them
  console.log("Unfiltered tags", this.tags);
  this.tags = _.filter(this.tags, (tag) => {
    return tag.generated === false;
  });
  console.log("Filtered tags", this.tags);
  this.tags.push({name: this.lowerName, generated: true});
  let plurals = [];
  for (let tag of this.tags) {
    tag.name = tag.name.toLowerCase();
    // Add plural/nonplural versions of each tag
    let singular = pluralize(tag.name.toLowerCase(), 1);
    let plural = pluralize(tag.name.toLowerCase(), 5);

    if (tag.name.toLowerCase() !== singular) {
      console.log("Adding singular tag", singular);
      plurals.push({name: singular, generated: true});
    }
    if (tag.name.toLowerCase() !== plural) {
      console.log("Adding plural tag", plural)
      plurals.push({name: plural, generated: true});
    }
  }
  // Dedupe tags
  this.tags = this.tags.concat(plurals);
  this.tags = _.uniq(this.tags, 'name');
  this.calculateCost();
  next();
});

exports.Food = mongoose.model("Food", foodSchema);
