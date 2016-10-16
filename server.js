'use strict';

const _ = require('underscore');
const express = require("express");
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const authUtils = require('./authUtils');
const jwt = require('express-jwt');
const passport = require('passport');
const passportConfig = require('./passport');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const parse5 = require('parse5');
const xmlser = require('xmlserializer');

const foodAPI = require('./food/api');
const foodAlexa = require('./food/alexa');
const permissions = require('./permissions');
const config = require('./utils').config;
const userModel = require('./food/userModel');
const User = userModel.User;

// Boilerplate crap

mongoose.Promise = global.Promise;
const port = process.env.PORT || 8443;
const mongoHost = config.MONGO_URI || 'mongodb://localhost/food';
mongoose.connect(mongoHost);

let app = express();

app.use(morgan('dev'));  // log every request to the console
app.use(cookieParser());  // read cookies (needed for auth)
app.use(bodyParser({limit: '50mb'}));  // get information from html forms
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'pug');

// HACK TO GET DATA FROM EXTENSION
// TODO: make this not a hack
app.use('/chromeExtension', function(req, res) {
  console.log("PRE EXTENSION", req.body.data)
  //console.log("EXTENSION", req.body, req.body.length, typeof req.body);
  var document = parse5.parse(req.body.data);
  //console.log("DOCUMENT", document);
  var xhtml = xmlser.serializeToString(document);
  //console.log("XHTML", xhtml);
  var doc = new dom().parseFromString(xhtml);
  //console.log("DOC", doc)
  let titleNode = xpath.select("//title", doc);
  console.log(titleNode, titleNode.localName);
  console.log("DONE")
  res.send("OK");
});

// Catch unauthorised errors
function authErrorHandler(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message": err.name + ": " + err.message});
  }
}
app.use(authErrorHandler);

// passport setup
passportConfig.setupStrategies(passport);
app.use(session({
  secret: config.SESSION_SECRET,
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());  // persistent login sessions
app.use(flash());

// Template rendering
app.get('/', function(req, res) {
  console.log("Rendering index");
  res.render("index.jade", {});
});

// process the login form
app.post('/login', function (req, res) {
  passport.authenticate('local-login', function (err, user, info) {
    let token;

    // If Passport throws/catches an error
    if (err) {
      res.status(404).json(err);
      return;
    }

    // If a user is found
    if (user) {
      token = userModel.generateJwt(user);
      res.status(200);
      res.json({"token": token});
    } else {
      // If user is not found
      res.status(401).json(info);
    }
  })(req, res);
});

// =====================================
// SIGNUP ==============================
// =====================================
// process the signup form
app.post('/signup', function (req, res) {
  let user = new User();

  // user.name = req.body.name;
  user.local.email = req.body.email;

  user.local.password = userModel.generateHash(req.body.password);

  user.save(function (err) {
    let token;
    if (err) {
      console.log("SignUpError", err);
      return res.status(400);
    }
    token = userModel.generateJwt(user);
    res.status(200);
    res.json({
               "token": token
             });
  });
});

app.post('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
app.get('/profile', permissions.authorizedOnly, function (req, res) {
  // If no user ID exists in the JWT return a 401
  if (!req.payload._id) {
    res.status(401).json({"message": "UnauthorizedError: private profile"});
  } else {
    // Otherwise continue
    User.findById(req.payload._id)
        .exec(function (err, user) {
          res.status(200).json(user);
        });
  }
});

// I feel like there might be a security problem here..
app.get('/partials/:partial', function(req, res) {
  res.render("partials/" + req.params.partial + ".jade", {});
});

// Init modules
let frontendConfigKeys = [];
let frontendScripts = [];
let frontendStyles = [];
let directives = [];

// Init modules
for (let name of config.MODULES) {
  let mod = require(name);
  console.log("Initializing", name);

  if (mod.init) {
    // If mod.init returns false, don't load the rest
    if (mod.init(config) === false) {
      console.log("Module returned false on init, skipping: ", name);
      continue;
    }
  }

  // Allow the module to add routes
  if (mod.routes) {
    app = mod.routes(app);
  }

  // Expose some of the config keys to the frontend
  if (mod.frontendConfig) {
    frontendConfigKeys = frontendConfigKeys.concat(mod.frontendConfig(config));
  }

  // Allow modules to add frontend scripts
  if (mod.scripts) {
    frontendScripts = frontendScripts.concat(mod.scripts);
  }

  // Allow modules to add frontend stylesheets
  if (mod.stylesheets) {
    frontendStyles = frontendStyles.concat(mod.stylesheets);
  }

  // Modules export Angular directives. Only allow those in the layout if the
  // module is initialize properly
  if (mod.directives) {
    directives = directives.concat(mod.directives);
  }
}

// Filter directives out of layout that aren't configured correctly
_.each(Object.keys(config.LAYOUT), function(key) {
  config.LAYOUT[key] = _.filter(config.LAYOUT[key], function(directive) {
    return directives.indexOf(directive) > -1
  });
});

console.log('FINAL LAYOUT', config.LAYOUT);

app.get('/mirror', function(req, res) {
  res.render("mirror.jade", {
    config: config,
    scripts: frontendScripts,
    stylesheets: frontendStyles
  });
});

app.get('/config.js', function(req, res) {
  "use strict";
  let base = 'angular.module("config", [])';
  frontendConfigKeys.forEach(function(key) {
    let val = config[key];
    console.log(key, val);
    base = base.concat(`.constant("${key}", "${val}")`);
  });
  res.header("Content-Type", "application/javascript");
  res.write(base);
  res.end();
});

// Load API routes for the letious apps
app = foodAPI.routes(app);

// Load Alexa apps
app = foodAlexa.routes(app);

// If it matches none of the above routes, check static files
app.use(express.static('./public'));
app.use('/bower_components/', express.static('./bower_components/'));
app.use('/node_modules/', express.static('./node_modules/'));
// Temporary hack to get mirror up
app.use('/mirror/', express.static('./mirror/'));

https.createServer({
  key: fs.readFileSync('./ssl/private-key.pem'),
  cert: fs.readFileSync('./ssl/certificate.pem'),
  requestCert: true,
  rejectUnauthorized: false
}, app).listen(port, function() {
  console.log("Secure Express server listening on port 8443");
});


