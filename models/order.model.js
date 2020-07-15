const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = Schema({
    buyer: {type: Schema.Types.ObjectId, ref: "User"},
    seller: {type: Schema.Types.ObjectId, ref: "User"},
    items: [{type: Schema.Types.ObjectId, ref: "Breakie"}]
}, { timestamps: true })

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;