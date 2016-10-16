var mongoose = require('mongoose');

var gifSchema = new mongoose.Schema({
  url: {type: String, required: true, unique: true},
  tags: [String],
  upvotes: {type: Number, default: 0},
  downvotes: {type: Number, default: 0}
});


module.exports = {
  Gif: mongoose.model('Gif', gifSchema)
};
