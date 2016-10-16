angular.module('food')
    .service('FoodAPI', function ($resource, $http, API_URL, Authentication) {
      var food = [];

      let headers = Authentication.getHeaders();

      var FoodResource = $resource(API_URL + "/foods/:id", {id: '@id'}, {
        'get': {method: 'GET', headers: headers},
        'save': {method: 'POST', headers: headers},
        'create': {method: 'POST', headers: headers},
        'query': {method: 'GET', isArray: true, headers: headers},
        'remove': {method: 'DELETE', headers: headers},
        'delete': {method: 'DELETE', headers: headers},
        'update': {method: 'PUT', headers: headers},
        'search': {method: 'GET', isArray: true, headeres: headers, params: {search: 'search'}}
      });

      return {
        resource: FoodResource,
        food: food,
        get: function () {
          return FoodResource.query().$promise.then(list => {
            food = list;
            return list;
          });
        },
        search: function(name) {
          return FoodResource.search({search: name}).$promise.then(list => {
            return list;
          });
        }
      }
    })
    .service('RecipeAPI', function ($resource, $http, API_URL, Authentication) {
      var recipe = [];

      let headers = Authentication.getHeaders();

      var RecipeResource = $resource(API_URL + "/recipes/:id", {id: '@id'},
          {
            'get': {method: 'GET', headers: headers},
            'save': {method: 'POST', headers: headers},
            'create': {method: 'POST', headers: headers},
            'query': {method: 'GET', isArray: true, headers: headers},
            'remove': {method: 'DELETE', headers: headers},
            'delete': {method: 'DELETE', headers: headers},
            'update': {method: 'PUT', headers: headers}
          }
      );

      return {
        resource: RecipeResource,
        recipe: recipe,
        get: function (id) {
          if (id) {
            return RecipeResource.get({id: id}).$promise.then(list => {
              recipe = list;
              return list;
            });
          } else {
            return RecipeResource.query().$promise.then(list => {
              recipe = list;
              return list;
            });
          }
        }
      }
    })
    .service('IngredientAPI', function ($resource, $http, API_URL, Authentication) {
      var ingredient = [];

      let headers = Authentication.getHeaders();

      var IngredientResource = $resource(API_URL + "/ingredients/:id", {id: '@id'}, {
        'get': {method: 'GET', headers: headers},
        'save': {method: 'POST', headers: headers},
        'create': {method: 'POST', headers: headers},
        'query': {method: 'GET', isArray: true, headers: headers},
        'remove': {method: 'DELETE', headers: headers},
        'delete': {method: 'DELETE', headers: headers},
        'update': {method: 'PUT', headers: headers},
        'search': {method: 'GET', isArray: true, headers: headers, params: {search: 'search'}}
      });

      return {
        resource: IngredientResource,
        ingredient: ingredient,
        get: function () {
          return IngredientResource.query().$promise.then(list => {
            ingredient = list;
            return list;
          });
        }
      }
    });
