var app = angular.module('jiffy',
    ['ngResource', 'ngTagsInput', 'ngMaterial'])
    .controller('Gifs', function ($scope, $log, $http, JiffyAPI) {
      $scope.gif = new JiffyAPI.GifResource({});
      $scope.gif.tags = [];

      $scope.submit = function (gif) {
        $log.debug("Submitting ", gif);
        $scope.gif.$save().then(function (data, status) {
          $scope.gif = new JiffyAPI.GifResource();
          $scope.gif.tags = [];
          $log.info("Submit success", data);
          // Refresh the gifs
          JiffyAPI.getGifs().then(gifs => {
            $scope.gifs = gifs;
          });
        });
      };

      JiffyAPI.getGifs().then(gifs => {
        $scope.gifs = gifs;
      });
    });
