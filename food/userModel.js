'use strict';
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt-nodejs');
// define the schema for our user model
var userSchema = new mongoose.Schema({
    alexaId: String,
    lastRecipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    },
    lastInstruction: Number,
    local: {
        email: String,
        password: String
    },
});
// methods ======================
// generating a hash
function generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}
exports.generateHash = generateHash;
// checking if password is valid
function validPassword(user, password) {
    return bcrypt.compareSync(password, user.local.password);
}
exports.validPassword = validPassword;
function generateJwt(user) {
    console.log("generating jwt", user);
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return jwt.sign({
        _id: user._id,
        email: user.local.email,
        name: user.name,
        exp: expiry.getTime() / 1000,
    }, "MY_SECRET"); // DO NOT KEEP YOUR SECRET IN THE CODE!
}
exports.generateJwt = generateJwt;
exports.User = mongoose.model("User", userSchema);
//# sourceMappingURL=userModel.js.map