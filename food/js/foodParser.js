'use strict';

const _ = require('underscore');
const unitsModule = require('./units');
const UNITS = unitsModule.units;
const unitEnum = unitsModule.unitsEnum;


const STOP_WORDS = ['of'];

const unitsAbbrs = {
  'ounce': UNITS.OUNCE,
  'ounces': UNITS.OUNCE,
  'oz': UNITS.OUNCE,
  'pound': UNITS.POUND,
  'pounds': UNITS.POUND,
  'lb': UNITS.POUND,
  'lbs': UNITS.POUND,
  'gram': UNITS.GRAM,
  'grams': UNITS.GRAM,
  'g': UNITS.GRAM,
  'cups': UNITS.CUP,
  'c': UNITS.CUP,
  'cup': UNITS.CUP,
  'tablespoon': UNITS.TABLESPOON,
  'tablespoons': UNITS.TABLESPOON,
  'tbs': UNITS.TABLESPOON,
  'tbsp': UNITS.TABLESPOON,
  'teaspoon': UNITS.TEASPOON,
  'teaspoons': UNITS.TEASPOON,
  'tsp': UNITS.TEASPOON,
  'each': UNITS.EACH,
  'pinch': UNITS.PINCH,
  'ml': UNITS.MILLILITER,
  'milliliter': UNITS.MILLILITER,
  'milliliters': UNITS.MILLILITER,
  'serving': UNITS.EACH,
  'servings': UNITS.EACH
};

const punctuationMarks = [',', '!', '?'];

class Ingredient {
  constructor(name, amount, unit, preparation) {
    super.constructor();

    if (!amount && !unit) {
      // Parse out amount and unit
      let ingredient = transformIngredient(name);
      this.name = ingredient[0];
      this.amount = ingredient[1];
      this.unit = ingredient[2];
      if (ingredient.length >= 4) {
        this.preparation = ingredient[3];
      }
    } else {
      this.name = name;
      this.amount = amount;
      this.unit = unit;
      this.preparation = preparation
    }
  }
}

// Helper function to parse out user inputted ingredient and turn it into an Ingredient
function transformIngredient(input) {
  console.log("Transforming Ingredient ", input);
  let ingredient, amount, unit;
  // The part of the string to switch from units to ingredients (inclusive)
  let ingredientIndex = 0;

  // Remove punctuation, go lowercase
  input = input.toLowerCase();
  for (let punctuation of punctuationMarks) {
    input.replace(punctuation, '');
  }

  let words = input.split(' ');
  console.log("words", words);
  if (isAmount(words[0])) {
    amount = parseAmount(words[0]);
    console.log("parsed amount", words[0], amount)
    // Check for things like '1 1/2'
    if (isAmount(words[1])) {
      amount = amount + parseAmount(words[1]);
    }

    // Scan for unit
    let unitIndex = findUnits(input);
    unit = unitIndex[0];
    ingredientIndex = unitIndex[1] + 1;

  } else {
    amount = 1;
    unit = 'each';
  }
  ingredient = cleanIngredient(words.slice(ingredientIndex).join(' '))[0];

  return [ingredient, amount, unit];
}

function isAmount(str) {
  if (!isNaN(str)) {
    return true;
  }
  let fraction = str.split('/');
  return (fraction.length == 2 && !isNaN(fraction[0]) && !isNaN(fraction[1]));
}

function parseAmount(str) {
  let fraction = str.split('/');
  if (fraction.length == 1) {
    return parseFloat(fraction);
  } else if (fraction.length == 2) {
    return parseFloat(fraction[0]) / parseFloat(fraction[1]);
  } else {
    throw new Error(`Not an amount: ${str}`);
  }
}

function findUnits(str) {
  punctuationMarks.forEach((mark) => {
    str = str.replace(mark, '');
  });

  let words = str.split(' ');
  let unitIndex;

  words.forEach(function(word, index) {
    if (unitsAbbrs[word] !== undefined) {
      if (!unitIndex) {
        unitIndex = [unitsAbbrs[word], index];
      }
    }
  });
  if (unitIndex) {
    return unitIndex;
  } else {
    throw new Error(`Could not find unit: ${str}`);
  }
}

// Strip out leading stop words
function cleanIngredient(str) {
  let words = str.split(' ');
  if (words && words.length > 0 && STOP_WORDS.indexOf(words[0]) > -1) {
    return [words.splice(1).join(' ')];
  }
  // TODO: preparation here
  return [str];
}

module.exports = {
  transformIngredient: transformIngredient,
  Ingredient: Ingredient,
  unitEnum: unitEnum
};
