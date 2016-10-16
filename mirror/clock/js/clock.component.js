'use strict';

angular.module('mirror.clock', [])
    .directive('clockSimple', function ($interval) {
      return {
        restrict: 'E',
        templateUrl: 'mirror/clock/clock.html',
        link: function ($scope) {
          $scope.date = new Date();
          $scope.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          $scope.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

          $scope.majors = new Array(12);
          $scope.minors = new Array(60);

          function tick() {
            $scope.date = new Date();
          }

          $interval(tick, 1000);
        }
      }
    })
    .filter('pad', function () {
      "use strict";
      return function (input) {
        if (input < 10) {
          return "0" + input;
        } else {
          return input;
        }
      }
    });
