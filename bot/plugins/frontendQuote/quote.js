angular.module('mirror')
    .directive('quote', function ($interval, $http) {
      console.log("QUOTE LOADED");
      return {
        restrict: 'E',
        templateUrl: 'static/quote/quote.html',
        link: function ($scope) {
          console.log("LINKING QUOTES");
          function pickQuote() {
            $http({
              method: 'GET',
              url: '/quotes'
            }).then(function successCallback(response) {
              console.log("GOT QUOTES", response.data);
              $scope.quotes = response.data;
              $scope.quote = $scope.quotes[Math.floor(Math.random() * $scope.quotes.length)];
              console.log("SETTING QUOTE", $scope.quote);
            });
          }

          // Pick a new quote once an hour
          $interval(pickQuote(), 60 * 60 * 1000);
          pickQuote();
        }
      }
    });
