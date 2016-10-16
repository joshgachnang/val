'use strict';
const utils = require('../utils');
const recipeModel = require('./recipeModel');
const foodModel = require('./foodModel');
const express = require('express');
const recipeAlexa = require('./alexa');
const jwt = require('express-jwt');
const permissions = require('../permissions');
const multer = require('multer');

var upload = multer({dest: 'uploads/'});

function routes(app) {

  let router;
  router = express.Router();

  router.get('/recipes/:id', permissions.authorizedOrReadOnly, function(req, res) {
    console.log("Rendering recipe");
    return recipeModel.Recipe.findById(req.params.id).then((recipe) => {
      recipeModel.Recipe.populate(recipe, {
        path: 'ingredients.food',
        populate: {path: 'food'}
      }).then((r) => {
        return res.json(r);
      });
    });
  });

  // Recipes
  router.get('/recipes', permissions.authorizedOrReadOnly, function(req, res) {
    return utils.apiList(req, res, recipeModel.Recipe);
  });

  function createOrUpdateRecipe(req, res) {
    var instancePromise;
    if (req.body._id) {
      instancePromise = recipeModel.Recipe.findOneAndUpdate({_id: req.body._id}, req.body).then((recipe) => {
        return recipeModel.Recipe.populate(recipe, {
          path: 'ingredients', populate: {
            path: 'food',
            model: 'Food'
          }
        })
      });
    } else {
      let instance = new recipeModel.Recipe(req.body);
      instancePromise = instance.save().then(() => {
        return recipeModel.Recipe.populate(instance, {
          path: 'ingredients', populate: {
            path: 'food',
            model: 'Food'
          }
        })
      })
    }

    instancePromise.then((instance) => {
      return instancePromise.then((recipe) => {
        recipeModel.calculateTotals(recipe);
        return recipe.save().then((result) => {
          return res.json(result);
        });
      });
    }).catch(function(result) {
      console.log("Failed to create/update Recipe", result);
      return res.status(400).json(result);
    });
  }

  router.post('/recipes', permissions.authorizedOrReadOnly, function(req, res) {
    return createOrUpdateRecipe(req, res);
  });

  router.put('/recipes/:id', permissions.authorizedOrReadOnly, function(req, res) {
    return createOrUpdateRecipe(req, res);
  });

  router.delete('/recipes/:id', permissions.authorizedOrReadOnly, function(req, res) {
    return utils.apiDelete(req, res, recipeModel.Recipe);
  });

  router.post('/recipes/upload', upload.single('file'), function(req, res, next) {
    console.log("file", req.file);
    console.log("body", req.body);
    res.json({image: req.file});
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
  });

  // Foods
  router.get('/foods', permissions.authorizedOrReadOnly, function(req, res) {
    console.log("food query", req.query);
    if (req.query.search) {
      console.log("Searching for foods", req.query.search.toLowerCase());
      return foodModel.Food.find({'tags.name': req.query.search.toLowerCase()}).then(function(results) {
        console.log('food search results', results);
        return res.json(results);
      });
    }
    else {
      return utils.apiList(req, res, foodModel.Food);
    }
  });

  router.get('/foods/:id', permissions.authorizedOrReadOnly, function(req, res) {
    return utils.apiGet(req, res, foodModel.Food);
  });

  function createOrUpdateFood(req, res) {
    var instancePromise;
    if (req.body._id) {
      console.log("Food body", req.body);
      instancePromise = foodModel.Food.findOneAndUpdate({_id: req.body._id}, req.body)
          .then((instance) => {
            // Not sure why we have to do this..
            instance.tags = req.body.tags;
            return instance.save();
          })
    } else {
      let instance = new foodModel.Food(req.body);
      instancePromise = instance.save();
    }

    return instancePromise.then((instance) => {
      console.log("Instance promise result", instance)
        instance.calculateCost();
        return instance.save().then((result) => {
          return res.json(result);
        });
    }).catch(function(result) {
      console.log("Failed to create/update Food", result);
      return res.status(400).json(result);
    });
  }

  router.post('/foods', permissions.authorizedOrReadOnly, function(req, res) {
    return createOrUpdateFood(req, res);
  });

  router.put('/foods/:id', permissions.authorizedOrReadOnly, function(req, res) {
    return createOrUpdateFood(req, res);
  });


  router.delete('/foods/:id', permissions.authorizedOrReadOnly, function(req, res) {
    return utils.apiDelete(req, res, foodModel.Food);
  });

  // Tags
  router.get('/tags', permissions.authorizedOrReadOnly, function(req, res) {
    return foodModel.Food.distinct("tags.name").then(function(tags) {
      console.log("tags", tags);
      return res.json(tags);
    });
  });
  app.use('/api/v1/', router);
  return app;
}

module.exports = {
  routes: routes
};
