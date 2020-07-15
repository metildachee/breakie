const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ingredientSchema = Schema({
    type: String
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

module.exports = Ingredient;