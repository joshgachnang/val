'use strict';
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// Config
var mongoHost = process.env.DB_HOST || 'mongodb://localhost/food';
mongoose.connect(mongoHost);

const foodModel = require('./foodModel');
const recipeModel = require('./recipeModel');

function uploadImage() {
  recipeModel.createImgurAlbum(['/Users/josh/Downloads/IMG_0841.JPG'], 'File');
}

function recipeDescription() {
  return recipeModel.Recipe.findOne({"_id": "57ba20413993955f9e83c185"}).then((recipe) => {
    recipe.images = ['19cf55f0cd87f296f6c96164cee01bc1'];
    recipe.imgurAlbum = undefined;
    return recipe.save();
  }).catch((e) => {
    console.log("err", e)
  })
}
// uploadImage();
recipeDescription().then((data) => {console.log(data)});
