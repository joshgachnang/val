'use strict';
var _ = require('underscore');
var jwt = require('express-jwt');


let WRITE_METHODS = ['POST', 'PUT', 'PATCH'];
let READ_METHODS = ['GET', 'OPTIONS'];

let jwtMiddleware = jwt({
  secret: 'MY_SECRET',
  userProperty: 'payload'
});

function isWrite(req) {
  return _.contains(WRITE_METHODS, req.method);
}

function isRead(req) {
  return _.contains(READ_METHODS, req.method);
}

function isOwner(req) {
  return true;
}

function authorizedOrReadOnly(req, res, next) {
  if (isRead(req)) {
    next();
  } else {
    return jwtMiddleware(req, res, next);
  }
}

function authorizedOnly(req, res, next) {
  return jwtMiddleware(req, res, next);
}

function readOnly(req, res, next) {
  if (isWrite(req)) {
    res.status(403).send('Not allowed to write, read only.');
    throw new Error('Not allowed to write, read only.');
  }
  next();
}

function ownerWrite(req, res, next) {
  if (!isOwner(req) && isWrite(req)) {
    res.status(403).send('Not allowed to write, you do not own this object.');
  }
  next();
}

function profile(req, res, next) {
  if (!isOwner(req)) {
    res.status(403).send('This is not your profile');
  }
  next();
}

module.exports = {
  readOnly: readOnly,
  ownerWritePublicRead: ownerWrite,
  profile: profile,
  authorizedOnly: authorizedOnly,
  authorizedOrReadOnly: authorizedOrReadOnly
};
