angular.module('mirror.quote', [])
    .directive('inspirationalQuote', function ($interval, $http) {
      return {
        restrict: 'E',
        templateUrl: 'mirror/quote/quote.html',
        link: function ($scope) {

          function pickQuote() {
            $http({
              method: 'GET',
              url: '/quotes'
            }).then(function successCallback(response) {
              $scope.quotes = response.data;
              $scope.quote = $scope.quotes[Math.floor(Math.random() * $scope.quotes.length)];
            });
          }

          // Pick a new quote once an hour
          $interval(pickQuote(), 60 * 60 * 1000);
          pickQuote();
        }
      }
    });
