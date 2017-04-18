import * as csv from 'fast-csv';
import * as fs from 'fs';

import AlexaAdapter from '../adapters/alexa';
import Response from '../response';
import Robot from '../robot';

export class Recipe {
  public id: string;
  constructor(public name: string, public description: string, public ingredients: string[],
              public instructions: string[], public calories: number, id?: string) {
    if (!id) {
      this.id = (Math.random() + 1).toString(36).substr(2, 16);
    } else {
      this.id = id;
    }
  }
}

export default function(robot: Robot) {
  function loadRecipes(): Recipe[] {
    let recipes: Recipe[] = [];
    let recipeData = robot.brain.get('recipes');
    if (!recipeData) {
      recipeData = [];
    }
    for (let rd of recipeData) {
      let recipe: Recipe;
      try {
        recipe = new Recipe(rd.name, rd.description, rd.ingredients, rd.instructions, rd.calories, rd.id);
      } catch (e) {
        robot.logger.warn(`Failed to create recipe instance from data: ${rd}`);
        continue;
      }
      recipes.push(recipe);
    }
    return recipes;
  }

  function saveRecipes(recipes: Recipe[]) {
    let recipeData = recipes;
    robot.brain.set('recipes', recipeData);
    robot.brain.save();
  }

  function saveRecipe(recipe: Recipe|any) {
    let recipes = loadRecipes();
    let newRecipe;
    let oldRecipe = recipes.filter((r) => r.id === recipe.id);
    if (oldRecipe.length === 1) {
      robot.logger.debug('Updating recipe');
      Object.assign(oldRecipe[0], recipe);
      newRecipe = oldRecipe[0];
    } else if (oldRecipe.length === 0) {
      robot.logger.debug('Saving new recipe');
      recipes.push(recipe);
      newRecipe = recipe;
    } else {
      robot.logger.warn(`Found ${oldRecipe.length} duplicate recipes`);
      return;
    }
    saveRecipes(recipes);
    return newRecipe;
  }

  function getRecipe(id: string): any {
    // TODO: holy inefficient batman
    let recipes = loadRecipes();
    return recipes.find((r) => r.id === id);
  }

  robot.router.get('/recipes', (req, res) => {
    let recipes = loadRecipes();
    return res.json({recipes});
  });

  robot.router.get('/recipes/:id', (req, res) => {
    let recipe = getRecipe(req.params.id);
    if (recipe) {
      res.json({recipe});
    } else {
      res.status(404).send();
    }
  });

  robot.router.post('/recipes', (req, res) => {
    robot.logger.debug(`Creating recipe from ${req.body}`);
    let recipe: Recipe;
    let ingredients = req.body.ingredients;
    let instructions = req.body.instructions;
    try {
      recipe = new Recipe(req.body.name, req.body.description, ingredients, instructions, req.body.calories);
    } catch (e) {
      robot.logger.warn(`Failed to construct recipe from ${req.body}: ${e}`);
      return res.status(400).send(`Failed to construct recipe from ${req.body}: ${e}`);
    }
    robot.logger.info(`[recipe] creating recipe: ${recipe}`);
    saveRecipe(recipe);
    res.status(201).json(recipe);
  });

  robot.router.put('/recipes/:id', (req, res) => {
    robot.logger.debug(`updating recipe ${req.params.id}: ${req.body}`);
    let recipe = getRecipe(req.params.id);
    Object.assign(recipe, req.body);
    res.json(saveRecipe(recipe));
  });

  robot.router.delete('/recipes/:id', (req, res) => {
    robot.logger.debug(`deleting recipe ${req.params.id}`);
    let recipes = loadRecipes();
    recipes = recipes.filter((r) => r.id !== req.params.id);
    saveRecipes(recipes);
  });
}
