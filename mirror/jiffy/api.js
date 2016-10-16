'use strict';

var models = require('./models');
var express = require('express');

let router = express.Router();

router.get('/', function(req, res) {
  res.render("index.jade", {});
});

router.post('/gifs', function(req, res) {
  var gif = new models.Gif({
    url: req.body.url,
    tags: req.body.tags
  });
  var savedGif = gif.save();
  console.log("Saved gif", savedGif);
  return res.json(savedGif);
});

router.get('/gifs', function(req, res) {
  if (req.query.search !== undefined) {
    return gifSearch(req, res);
  } else {
    var limit;
    if (req.query.limit !== undefined) {
      limit = req.query.limit;
    } else {
      limit = 20;
    }
    models.Gif.find().limit(limit).then(function(results) {
      res.send(results);
    })
  }
});

router.get('/gifs/:gifId', function(req, res) {
  return models.Gif.findById(req.params.gifId).then(function(gif) {
    return res.json(gif.lean());
  });
});

router.put('/gifs/:gifId/upvote', function(req, res) {
  return vote(req, res, true);
});

router.put('/gifs/:gifId/upvote', function(req, res) {
  return vote(req, res, false);
});

function gifSearch(req, res) {
  "use strict";
  // Magic

  // Prefer tags with the longest, contiguous match from the query
  // e.g. a gif tagged "archer danger zone" should match before "danger zone".

  console.log("gifSearch: " + req.query.search);
  let query = req.query.search.split(' ');
  // Start
  let tags = [];
  query.forEach(function(word, index, words) {
    // Append each possible tag combination
    tags.push(word);
    let i = index + 1;
    let prev = word;
    while (i < words.length) {
      prev += " ";
      prev += words[i];
      tags.push(prev);
      i++;
    }
  });
  console.log("Tags");

  models.Gif.aggregate([
        {$match: {"tags": {$in: tags}}},
        {
          $project: {
            "tagsCopy": "$tags",
            "tags": 1
          }
        },
        {$unwind: "$tags"},
        {$match: {tags: {$in: tags}}},
        {
          $group: {
            "_id": "$_id",
            "noOfMatches": {$sum: 1},
            "tags": {$first: "$tagsCopy"}
          }
        },
        {$sort: {noOfMatches: -1}},
        {
          $project: {
            "_id": 1,
            "noOfMatches": 1,
            tags: 1
          }
        }],
      function(err, results) {
        // Make a list of _ids
        let ids = results.map(gif => gif._id);
        models.Gif.find({_id: {$in: ids}})
            .then(function(obs) {
              res.send(obs);
            })
            .catch(function(err) {
              res.statusCode(500).send(err)
            });
      });

}

function vote(req, res, isUpvote) {
  return models.Gif.findById(req.params.gifId).then(function(gif) {
    if (isUpvote === true) {
      gif.upvotes++;
    } else if (isUpvote === false) {
      gif.downvotes++;
    }
    return gif.save().then(function(gif) {
      return res.json(gif);
    });
  });
}
