angular.module('jiffy')
    .service('JiffyAPI', function ($resource, $http, API_URL) {
      var gifs = [];

      var GifResource = $resource(API_URL + "/gifs", {}, {
        upvote: {method: 'PUT'},
        downvote: {method: 'PUT'}
      });

      return {
        GifResource: GifResource,
        gifs: gifs,
        getGifs: function () {
          console.log('get gifs', this);
          return GifResource.query().$promise.then(gifList => {
            console.log('queried gifs', gifList, gifs);
            gifs = gifList;
            console.log('gifs now', gifs);
            return gifList;
          });
        }
      }
    });
