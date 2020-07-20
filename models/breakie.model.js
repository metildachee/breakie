const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const breakieSchema = Schema({
    name: {
        required: true,
        type: String
    },
    rating: Number,
    image: String,
    desc: String,
    ingredients: [{type: Schema.Types.ObjectId, ref: "Ingredient"}],
    qty: {
        required: true, 
        type: Number
    },
    price: {
        required: true, 
        type: Number
    },
    timeout: Number,
    cuisine: {type: Schema.Types.ObjectId, ref: "Cuisine"},
    creator: {type: Schema.Types.ObjectId, ref: "User"}
}, { timestamps: true });

// breakieSchema.index({"$**": 'text'});

const Breakie = mongoose.model("Breakie", breakieSchema);

module.exports = Breakie;