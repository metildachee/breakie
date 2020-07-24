const mongoose = require('mongoose');
const mongooseAlgolia = require('mongoose-algolia');
require('dotenv').config();

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
    deleted: {
        type: Boolean,
        default: false
    },
    timeout: Number,
    cuisine: {type: Schema.Types.ObjectId, ref: "Cuisine"},
    creator: {type: Schema.Types.ObjectId, ref: "User"}
}, { timestamps: true });

breakieSchema.plugin(mongooseAlgolia, {
    appId: "73KCNG918X",
    apiKey: process.env.ALGOLIA_API_KEY,
    indexName: "breakie",
    debug: true,
    populate: {
        path: "ingredients cuisine creator",
    }
})

const Breakie = mongoose.model("Breakie", breakieSchema);

breakieSchema.pre('save', async next => {
    await Breakie.SyncToAlgolia();
    await Breakie.SetAlgoliaSettings({
        searchableAttributes: ['name', 'desc', 'price', 'cuisine.type', 'creator', 'ingredients'], 
    })
    next();
})

module.exports = Breakie;