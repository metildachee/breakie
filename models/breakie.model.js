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
    timeout: Number,
    cuisine: {type: Schema.Types.ObjectId, ref: "Cuisine"},
    creator: {type: Schema.Types.ObjectId, ref: "User"}
}, { timestamps: true });

// breakieSchema.index({"$**": 'text'});

breakieSchema.plugin(mongooseAlgolia, {
    appId: "73KCNG918X",
    apiKey: process.env.ALGOLIA_API_KEY,
    indexName: "breakie",
    debug: true,
    populate: {
        path: "ingredients cuisine",
    }
})


//@desc algolia searching
const Breakie = mongoose.model("Breakie", breakieSchema);
Breakie.SyncToAlgolia() //Clears the Algolia index for this schema and synchronizes all documents to Algolia (based on the settings defined in your plugin settings)
Breakie.SetAlgoliaSettings({
  searchableAttributes: ['name', 'desc', 'price'], //Sets the settings for this schema, see [Algolia's Index settings parameters](https://www.algolia.com/doc/api-client/javascript/settings#set-settings) for more info.
})

module.exports = Breakie;