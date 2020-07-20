const mongoose = require('mongoose');

const Schema = mongoose.Schema;

imageSchema = Schema({
    img: {
        refId: String,
        contentType: String
    }
});

module.exports = mongoose.model("Image", imageSchema);