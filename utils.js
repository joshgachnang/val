// Config
var config;
if (process.env.MAGIC_MIRROR_CONFIG) {
  config = require(process.env.MAGIC_MIRROR_CONFIG);
} else {
  config = require('./config/config.js');
}


// API Utils
function apiList(req, res, model) {
  console.log("Listing for model:", model.modelName);
  return model.find().then(function(results) {
    return res.json(results);
  });
}

function apiGet(req, res, model) {
  console.log("Getting for model", model.modelName, req.params.id);
  return model.findOne({_id: req.params.id}).then(function(results) {
    return res.json(results);
  });
}

function apiCreate(req, res, model) {
  console.log("Creating model", model.modelName, req.body);
  var instance = new model(req.body);
  instance.save().then(function(result) {
    return res.json(result)
  }).catch(function(result) {
    console.log("Failed to create for model", model.modelName, result);
    return res.status(400).json(result);
  });
}

function apiDelete(req, res, model) {
  console.log("Deleting instance", model.modelName, req.params.id);
  model.remove({_id: req.params.id}).then(function(results) {
    return res.json(results)
  }).catch(function(result) {
    return res.status(400).json(result);
  });
}

module.exports = {
  apiList: apiList,
  apiGet: apiGet,
  apiCreate: apiCreate,
  apiDelete: apiDelete,
  config: config
};
