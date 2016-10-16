'use strict';

const passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
const userModel = require('./food/userModel');
let User = userModel.User;

function setupStrategies(passport) {

  // ====================== //
  // passport session setup //
  // ====================== //
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  // ============ //
  // LOCAL SIGNUP //
  // ============ //

  passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
      },
      function (username, password, done) {
        User.findOne({email: username}, function (err, user) {
          if (err) {
            return done(err);
          }
          // Return if user not found in database
          if (!user) {
            return done(null, false, {
              message: 'User not found'
            });
          }
          // Return if password is wrong
          if (!userModel.validPassword(user, password)) {
            return done(null, false, {
              message: 'Password is wrong'
            });
          }
          // If credentials are correct, return the user object
          return done(null, user);
        });
      }
  ));

  // =========== //
  // LOCAL LOGIN //
  // =========== //
  // We create another strategy for the login process

  passport.use('local-login', new LocalStrategy({
        // change default username for email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },
      function (req, email, password, done) {
        // first check if the user already exists
        User.findOne({'local.email': email}, function (err, user) {
          // If there are any error, return the error
          if (err) {
            return done(err);
          }

          // if no user is found, return message
          if (!user) {
            console.log("USER NOT FOUN")
            return done(null, false, req.flash('loginMessage', 'No user found.'));
          }

          // if the user exists, we check the password
          if (!userModel.validPassword(user, password)) {
            console.log("INVALID PASSWORD");
            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
          }

          // if everything is ok, return the user
          return done(null, user);
        });
      })
  );

}

module.exports = {
  setupStrategies: setupStrategies
}
