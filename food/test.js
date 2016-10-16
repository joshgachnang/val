'use strict';

const chai = require('chai');
const assert = chai.assert;

const Ingredient = require('../js/foodParser').Ingredient;

describe('test transforming ingredient', function () {
  it('simple transform', function () {
    let i = new Ingredient('3 cups all-purpose flour');
    assert.equal(3, i.amount);
    assert.equal('cup', i.unit);
    assert.equal('all-purpose flour', i.name);
    assert.isUndefined(i.preparation);
  });

  it('punctuation in unit', function() {
    let i = new Ingredient('4 oz. steak');
    assert.equal(4, i.amount);
    assert.equal('ounce', i.unit);
    assert.equal('steak', i.name);
    assert.isUndefined(i.preparation);
  });

  it('fractional amount', function () {
    let i = new Ingredient('1 1/2 cups of sugar');
    assert.equal(1.5, i.amount);
    assert.equal('cup', i.unit);
    assert.equal('sugar', i.name);
    assert.isUndefined(i.preparation);
  });

  it('no unit', function () {
    let i = new Ingredient('salt and pepper');
    assert.equal(1, i.amount);
    assert.equal('each', i.unit);
    assert.equal('salt and pepper', i.name);
    assert.isUndefined(i.preparation);
  })
});
