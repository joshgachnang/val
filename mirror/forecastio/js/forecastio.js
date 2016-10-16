'use strict';

angular.module('mirror.forecastio', [])
    .factory('Weather', function ($q, $resource, $http, FORECASTIO_KEY) {
        var url = 'https://api.forecast.io/forecast/' + FORECASTIO_KEY + '/';

        var weatherResource = $resource(url, {
          callback: 'JSON_CALLBACK'
        }, {
          get: {
            method: 'JSONP'
          }
        });

        return {
            getCurrentWeather: function (lat, lng) {
                // Convenience function to just get current weather
                var deferred = $q.defer();

                $http.jsonp(url + lat + ',' + lng + '?callback=JSON_CALLBACK').then(function (result) {
                    var data = result.data;
                    deferred.resolve(data.currently);
                });
                return deferred.promise;
            },
            getWeather: function (lat, lng) {
                var deferred = $q.defer();

                $http.jsonp(url + lat + ',' + lng + '?callback=JSON_CALLBACK').then(function (result) {
                    var data = result.data;
                    deferred.resolve(data);
                });
                return deferred.promise;
            }
        }
    })
    .directive('forecastioSimple', function (Weather, LATITUDE, LONGITUDE, $interval) {
        "use strict";

        return {
            restrict: 'E',
            templateUrl: 'mirror/forecastio/simple_forecast.html',
            link: function ($scope) {
                function updateWeather() {
                    Weather.getWeather(LATITUDE, LONGITUDE).then(function(result) {
                        $scope.weather = result;
                        $scope.forecasts = result.daily.data;
                    });
                }

                // Update weather every 15 mins
                $interval(updateWeather, 15* 60 * 1000);
                updateWeather();
            }
        };
    })
    .directive('weatherIcon', function () {
        return {
            restrict: 'AEC',
            templateUrl: 'mirror/forecastio/weather_icon.html',
            scope: {
                icon: '=',
                timeOfDay: '='
            }
        }
    })
    .filter('toInt', function () {
        return function (float) {
            return parseInt(float);
        }
    })
    .filter('unixToDOW', function () {
        return function (dt) {
            var dow = new Date(dt * 1000).getDay();
            var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
            return days[dow];
        }
    });

