'use strict';

angular.module('mirror.uber', [])
    .directive('uberEstimate', function ($http, $interval) {
      return {
        restrict: 'E',
        templateUrl: 'mirror/uber/uber.html',
        link: function ($scope) {

          function refreshUber() {
            $http({
              method: 'GET',
              url: '/uber'
            }).then(function successCallback(response) {
              console.log(response);
              $scope.estimate = response.data.times[0];
            });
          }

          $interval(refreshUber(), 60 * 1000);
          refreshUber();
        }
      }
    });
