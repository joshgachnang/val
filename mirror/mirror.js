const clock = require('./clock/js/clock.component');
const chicatoCTA = require('./chicagoCTA/js/cta.component');
const forecast = require('./forecastio/js/forecastio');
const googleCalendar = require('./googleCalendar/js/calendar.component');
const quote = require('./quote/js/quote');
const uber = require('./uber/js/uber');

var app = angular.module('mirror',
    ['config',
      'mirror.clock',
      'mirror.cta',
      'mirror.forecastio',
      'mirror.googleCalendar',
      'mirror.quote',
      'mirror.uber',
      'ngResource'])
    .filter('pad', function () {
      return function (num) {
        return (num < 10 ? '0' + num : num);
      };
    })

    .filter('addSuffix', function () {
      return function (num) {
        if (num % 100 >= 10 && num % 100 <= 19) {
          return num + 'th';
        }

        switch (num % 10) {
          case 1:
            return num + 'st';
          case 2:
            return num + 'nd';
          case 3:
            return num + 'rd';
        }

        return num + 'th';
      };
    });
