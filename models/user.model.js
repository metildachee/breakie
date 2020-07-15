const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = Schema({
    username: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    email: {
        required: true,
        type: String
    },
    address: {
        required: true,
        type: String
    },
    orders: [{type: Schema.Types.ObjectId, ref: "Order"}],
    publishes: [{type: Schema.Types.ObjectId, ref: "Breakie"}],
    archived: [{type: Schema.Types.ObjectId, ref: "Breakie"}]
});

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

const User = mongoose.model("User", userSchema);

module.exports = User;