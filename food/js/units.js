const _ = require('underscore');

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
  MILLILITER: 'milliliter',
  CONTAINER: 'container'
};

const unitsEnum = _.values(UNITS);

module.exports = {
  units: UNITS,
  unitsEnum: unitsEnum
};
