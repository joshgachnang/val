'use strict';

let Ingredient = require('./foodParser').Ingredient;
let unitEnum = require('./units').unitsEnum;
let _ = require('underscore');

angular.module('food',
    ['ui.router', 'ngResource', 'ngTagsInput', 'ngMaterial', 'xeditable', 'cgBusy', 'angularFileUpload'])
    .config(function($mdThemingProvider) {
      $mdThemingProvider.theme('default')
          .primaryPalette('light-blue')
          .accentPalette('green');
    })
    .value('cgBusyDefaults', {
      templateUrl: '/templates/angular-busy.html'
    })
    .service('Authentication', function authentication($http, $window, $rootScope) {

      // Cache token since isLoggedIn will be called a lot
      let cachedToken = null;

      let getToken = function() {
        return $window.localStorage['mean-token'];
      };

      let saveToken = function(token) {
        console.log("Saving token", token);
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        $window.localStorage['mean-token'] = token;
        cachedToken = token;
      };

      let logout = function() {
        return $http.post('/logout', user).success(() => {
          $window.localStorage.removeItem('mean-token');
          cachedToken = null;
        });
      };

      let signup = function(user) {
        return $http.post('/signup', user).success((data) => {
          saveToken(data.token);
        });
      };

      let login = function(user) {
        return $http.post('/login', user).success(function(data) {
          saveToken(data.token);
        });
      };

      let getHeaders = function() {
        return {
          'Authorization': 'Bearer ' + getToken()
        }
      };

      let isLoggedIn = function() {
        console.log("Is Logged In", cachedToken);
        return cachedToken !== null && cachedToken !== undefined;
      };

      cachedToken = getToken();

      // Let all templates check auth status
      $rootScope.isLoggedIn = isLoggedIn;

      return {
        saveToken: saveToken,
        getToken: getToken,
        logout: logout,
        signup: signup,
        login: login,
        getHeaders: getHeaders,
        isLoggedIn: isLoggedIn
      };
    })

    .controller('FoodController', function($scope, $log, $state, FoodAPI, RecipeAPI) {
      $scope.units = unitEnum;

      RecipeAPI.get().then(recipes => {
        $scope.recipes = recipes;
      });

      FoodAPI.get().then(foods => {
        $scope.foods = foods;
      });

      $scope.ingredient = {};

      $scope.ingredientSubmit = function() {
        $log.debug('Saving ingredient', $scope.ingredient);
        $scope.ingredient.food = $scope.ingredient.food._id;
        $scope.recipe.ingredients.push($scope.ingredient);
        $scope.ingredient = {};
      };

      $scope.recipe = new RecipeAPI.resource({});
      $scope.recipe.ingredients = [];
      $scope.recipeSubmit = function() {
        // TODO: Instructions gets turned to an array too quick..or not turned back?
        if (typeof $scope.recipe.instructions === "string") {
          $scope.recipe.instructions = $scope.recipe.instructions.split('\n');
        }
        //$scope.recipe.images = [$scope.recipe.image];

        console.log("Split instructions");
        $scope.recipe.$save().then(function(result) {
          console.log("Recipe save result", result);
          $scope.recipe = new RecipeAPI.resource({});
        });
      };

      $scope.deleteRecipe = function(recipe) {
        console.log('removing', recipe);
        recipe.$remove({id: recipe._id}).then(function() {
          RecipeAPI.get().then(recipes => {
            $scope.recipes = recipes;
          });
        });
      };

      $scope.updateIngredient = function(ingredient) {
        console.log("UPDATE INGREDIENT", ingredient);
        if (ingredient.input) {
          let model = new Ingredient(ingredient.input);
          console.log(model);
        }
      };

      $scope.minPrice = function(food) {
        var array = [];
        if (food.targetPrice && !isNaN(food.targetPrice)) {
          array.push(food.targetPrice);
        }
        if (food.amazonPrice && !isNaN(food.amazonPrice)) {
          array.push(food.amazonPrice);
        }
        if (food.costcoPrice && !isNaN(food.costcoPrice)) {
          array.push(food.costcoPrice);
        }
        if (array.length === 0) {
          return "-"
        } else {
          return "$" + Math.min(array);
        }
      };

      $scope.deleteFood = function(food) {
        $log.debug('removing food', food);
        food.$remove({id: food._id}).then(function() {
          FoodAPI.get().then(foods => {
            $scope.foods = foods;
          });
        });
      };

      $scope.deleteRecipe = function(recipe) {
        $log.debug('removing recipe', recipe);
        recipe.$remove({id: recipe._id}).then(function() {
          RecipeAPI.get().then(recipes => {
            $scope.recipes = recipes;
          });
        });
      };

      $scope.editRecipe = function(recipe) {
        $state.go('addRecipe', {editRecipe: recipe});
      };

      $scope.editFood = function(food) {
        console.log("Editting food")
        $state.go('addFood', {editFood: food});
      }

    })
    .controller("RecipeController", function($scope, $stateParams, RecipeAPI) {
      RecipeAPI.get($stateParams.id).then(recipe => {
        $scope.recipe = recipe;
      });
    })
    .controller("AddRecipeController", function($scope, $stateParams, $log, FileUploader, FoodAPI, RecipeAPI) {
      console.log("ADD RECIPE");
      let imageIds = [];

      FoodAPI.get().then(foods => {
        $scope.foods = foods;
      });
      console.log($stateParams.editRecipe);
      $scope.edit = ($stateParams.editRecipe !== null);

      if ($scope.edit) {
        $scope.recipe = $stateParams.editRecipe;
        $scope.recipe.instructions = $scope.recipe.instructions.join("\n");
        console.log($scope.recipe.instructions)
      } else {
        $scope.recipe = new RecipeAPI.resource({});
      }

      let uploader = $scope.uploader = new FileUploader({
        url: '/api/v1/recipes/upload'
      });

      uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
      };
      uploader.onAfterAddingFile = function(fileItem) {
        console.info('onAfterAddingFile', fileItem);
      };
      uploader.onAfterAddingAll = function(addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
      };
      uploader.onBeforeUploadItem = function(item) {
        console.info('onBeforeUploadItem', item);
      };
      uploader.onProgressItem = function(fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
      };
      uploader.onProgressAll = function(progress) {
        console.info('onProgressAll', progress);
      };
      uploader.onSuccessItem = function(fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
      };
      uploader.onErrorItem = function(fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
      };
      uploader.onCancelItem = function(fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
      };
      uploader.onCompleteItem = function(fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
        imageIds.push(response.image.filename);
      };
      uploader.onCompleteAll = function() {
        console.info('onCompleteAll');
        doSubmit();
      };

      // Start off with 5 ingredient fields
      $scope.recipe.ingredients = [];
      $scope.recipeSubmit = function() {
        console.log("submitting recipe", $scope.recipe);

        for (let item of uploader.queue) {
          console.log("Uploading item", item);
          item.upload();
        }
      };

      function doSubmit() {
        // TODO: Instructions gets turned to an array too quick..or not turned back?
        if (typeof $scope.recipe.instructions === "string") {
          $scope.recipe.instructions = $scope.recipe.instructions.split('\n');
        }
        // $scope.recipe.images = [$scope.recipe.image.base64];
        $scope.recipe.images = imageIds;

        var promise;
        if ($scope.edit) {
          promise = $scope.recipe.$update({id: $scope.recipe._id});
        } else {
          promise = $scope.recipe.$save();
        }
        console.log("recipe save/update promise", promise);

        promise.then(function(result) {
          console.log("Recipe save result", result);
          if ($scope.edit) {
            $scope.recipe = result;
            $scope.recipe.instructions = $scope.recipe.instructions.join("\n");
          } else {
            $scope.recipe = new RecipeAPI.resource({});
          }
        }).catch((e) => {
          console.log("Recipe save error", e)
        });
      }

      $scope.findFood = function(food) {
        let model;
        if (food.input) {
          try {
            model = new Ingredient(food.input);
          } catch (e) {
            return;
          }

          food.ingredient = model;
          if (model.name) {
            FoodAPI.search(model.name).then(list => {
              food.searchResults = list;
            });
          }
        }
      };

      $scope.selectIngredient = function(ingredient, food) {
        $log.debug('Saving ingredient', ingredient, food);

        let i = {};
        i.food = ingredient;
        i.amount = food.ingredient.amount;
        i.unit = food.ingredient.unit;
        $scope.recipe.ingredients.push(i);
        $scope.food.input = "";
        $scope.food.searchResults = [];
      };

      $scope.deleteIngredient = function(index) {
        $scope.food.searchResults.splice(index, 1);
      }
    })
    .controller("AddFoodController", function ($scope, $stateParams, FoodAPI) {
      $scope.units = unitEnum;
      $scope.edit = ($stateParams.editFood !== null);

      if ($scope.edit) {
        $scope.food = $stateParams.editFood;
        let userTags = _.filter($scope.food.tags, (tag) => {
          return tag.generated == false;
        });
        $scope.food.tags = _.map(userTags, (tag) => {
          if (!tag.generated) {
            return tag.name
          }
        });
      } else {
        $scope.food = new FoodAPI.resource({});
        $scope.food.tags = [];
      }

      $scope.busy = null;
      $scope.foodSubmit = function() {
        console.log("pre tags", $scope.food.tags);
        $scope.food.tags = _.map($scope.food.tags, (tag) => {
          return {name: tag}
        });
        console.log("post tags", $scope.food.tags);

        let promise;
        if ($scope.edit) {
          promise = $scope.food.$update({id: $scope.food._id});
        } else {
          promise = $scope.food.$save();
        }

        $scope.busy = promise;
        promise.then((food) => {
          $scope.foodForm.$setPristine();
          $scope.foodForm.$setUntouched();

          if ($scope.edit) {
            console.log(food.tags);
            console.log(food);
            $scope.food = food;
            let userTags = _.filter(food.tags, (tag) => {
              return tag.generated === false;
            });
            // TODO: there's some bug here where half show up as real tags, half as words
            $scope.food.tags = _.map(userTags, (tag) => {
              if (!tag.generated) {
                return tag.name
              }
            });
          } else {
            $scope.food = new FoodAPI.resource({});
            $scope.food.tags = [];
          }
          // $scope.foodForm.$setUntouched();
          // $scope.foooForm.$setPristine();
          FoodAPI.get().then(foods => {
            $scope.foods = foods;
          });
        });
      };
    })
    .controller("SignupController", function ($scope, $http, $state, Authentication) {
      $scope.form = {};
      $scope.signup = function () {
        let user = {
          email: $scope.form.email,
          password: $scope.form.password
        };
        Authentication.signup(user).then((response) => {
          $scope.error = "";
          console.log("Success signing up", response);
          $state.go('profile')
        }).catch((err) => {
          $scope.error = err.statusText;
          console.log("Error signing up", err);
        })
      }
    })
    .controller('LoginController', function ($http, $scope, $state, Authentication) {
      $scope.form = {};
      $scope.login = function() {
        $scope.error = "";
        let user = {
          email: $scope.form.email,
          password: $scope.form.password
        };

        Authentication.login(user)
        .then((user) => {
          console.log("Success logging in", user);
          $state.go('profile')
        }).catch((err) => {
          $scope.error = err.statusText;
          console.log("Error logging in", err);
        })
      };

      // $http({
      //   method: 'POST',
      //   url: '/login',
      //   data: $scope.form,
      //   transformRequest: function(obj) {
      //     var str = [];
      //     for (var p in obj)
      //       str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      //     return str.join("&");
      //   },
      //   headers: {'Content-Type': 'application/x-www-form-urlencoded'}

    })
    .controller('ProfileController', function($http, Authentication) {
      let token = Authentication.getToken();
      console.log("Auth token", token);
      $http.get('/profile', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      }).then((user) => {
        console.log("User object", user);
      });
    })
    // Transform a
    .filter('amount', function () {
      return function(ingredient) {
        let str;
        // TODO: need to factor in conversion factor
        if (ingredient.unit === "each") {
          str = ingredient.amount;
        } else {
          str = ingredient.amount + " " + ingredient.unit;
        }
        return str
      }
    })
    // Customize xeditable for material design
    .run(function(editableOptions, editableThemes) {
      editableThemes['angular-material'] = {
        formTpl: '<form class="editable-wrap"></form>',
        noformTpl: '<span class="editable-wrap"></span>',
        controlsTpl: '<md-input-container class="editable-controls" ng-class="{\'md-input-invalid\': $error}"></md-input-container>',
        inputTpl: '',
        errorTpl: '<div ng-messages="{message: $error}"><div class="editable-error" ng-message="message">{{$error}}</div></div>',
        buttonsTpl: '<span class="editable-buttons"></span>',
        submitTpl: '<md-button type="submit" class="md-primary">save</md-button>',
        cancelTpl: '<md-button type="button" class="md-warn" ng-click="$form.$cancel()">cancel</md-button>'
      };

      editableOptions.theme = 'angular-material';
    })
    .config(function($stateProvider, $urlRouterProvider, $locationProvider) {
      //
      // For any unmatched url, redirect to /state1
      $urlRouterProvider.otherwise("/recipes");
      //
      // Now set up the states
      $stateProvider
          .state('recipes', {
            url: "/recipes",
            templateUrl: "partials/recipes",
            controller: "FoodController"
          })
          .state('recipe', {
            url: "/recipes/:id",
            templateUrl: "partials/recipe",
            controller: "RecipeController"
          })
          .state('addRecipe', {
            url: "/addRecipe",
            templateUrl: "partials/addRecipe",
            controller: "AddRecipeController",
            params: {editRecipe: null}
          })
          .state('addFood', {
            url: "/addFood",
            templateUrl: "partials/addFood",
            controller: "AddFoodController",
            params: {editFood: null}
          })
          .state('signup', {
            url: "/signup",
            templateUrl: "partials/signup",
            controller: "SignupController"
          })
          .state('login', {
            url: "/login",
            templateUrl: "partials/login",
            controller: "LoginController"
          })
          .state('profile', {
            url: "/profile",
            templateUrl: "partials/profile",
            controller: "ProfileController"
          });
    })
    .run(function($rootScope, $location, Authentication) {
      $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
        if ($location.path() === '/profile' && !Authentication.isLoggedIn()) {
          $location.path('/');
        }
      });
    });
