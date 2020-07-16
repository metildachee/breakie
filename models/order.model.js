const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = Schema({
    completed: {
        type: Boolean,
        default: false,
    },
    paid: {
        type: Boolean,
        default: false,
    },
    price: Number,
    buyer: {type: Schema.Types.ObjectId, ref: "User"},
    buyerContact: String,
    seller: {type: Schema.Types.ObjectId, ref: "User"},
    items: [{
                breakie: {type: Schema.Types.ObjectId, ref: "Breakie"},
                qty: Number
            }]
}, { timestamps: true })

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;