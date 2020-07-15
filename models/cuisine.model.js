const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cuisineSchema = Schema({
    type: String
});

const Cuisine = mongoose.model("Cuisine", cuisineSchema);
module.exports = Cuisine;