const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ingredientSchema = Schema({
    type: String
});

ingredientSchema.index({'$**': 'text'});
const Ingredient = mongoose.model("Ingredient", ingredientSchema);

module.exports = Ingredient;