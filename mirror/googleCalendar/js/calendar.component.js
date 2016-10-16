'use strict';

var weekDaysShort = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];

angular.module('mirror.googleCalendar', [])
    .service('Calendar', function($interval, $http, $log) {
      var Calendar = {
        calendars: []
      };

      // Query the server for updated calendars
      function refreshCalendars() {
        $log.debug("Refreshing calendars");
        $http({
          method: 'GET',
          url: '/calendars'
        }).then(function successCallback(response) {
          var calendars = _.flatten(response.data);
          Calendar.calendars = _.sortBy(calendars, function(calendar) {
            if (calendar.start.dateTime && calendar.end.dateTime) {
              return calendar.start.dateTime;
            } else if (calendar.start.date) {
              return calendar.start.date;
            }
          });
        });
      }

      // Refresh every 5 minutes
      $interval(refreshCalendars(), 5 * 60 * 1000);
      refreshCalendars();

      return Calendar;
    })
    .directive('googleCalendar', function(Calendar) {
      return {
        restrict: 'E',
        templateUrl: 'mirror/googleCalendar/calendars.html',
        link: function ($scope) {
          $scope.calendars = Calendar.calendars;
        }
      };
    })
    .filter('eventTime', function () {
      return function (event) {
        var now = new moment();
        var start, diff, weekday;
        if (event.start.dateTime && event.end.dateTime) {
          start = moment(event.start.dateTime);
          var end = moment(event.end.dateTime);
          diff = moment.duration(start.diff(now));
          if (diff.asDays() <= 6) {
            if (start.weekday() == now.weekday()) {
              weekday = "Today";
            } else {
              weekday = weekDaysShort[start.weekday()];
            }

            return weekday + " " + start.format("HH:mm") + "-" + end.format("HH:mm")
          } else {
            console.log("Over 1 week");
            return "Next week"
          }
        } else if (event.start.date) {
          start = moment(event.start.date);
          if (start.weekday() == now.weekday()) {
            weekday = "Today";
          } else {
            weekday = weekDaysShort[start.weekday()] + " all day";
          }
          return weekday
        }
      }
    })
    .filter('trim', function () {
      return function (value, wordwise, max, tail) {
        if (!value) {
          return '';
        }

        max = parseInt(max, 10);
        if (!max) {
          return value;
        }
        if (value.length <= max) {
          return value;
        }

        value = value.substr(0, max);
        if (wordwise) {
          var lastspace = value.lastIndexOf(' ');
          if (lastspace != -1) {
            value = value.substr(0, lastspace);
          }
        }

        return value + (tail || ' …');
      };
    });
