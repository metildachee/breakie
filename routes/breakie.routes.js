const express = require('express');
const router = express.Router();
const Breakies = require('../models/breakie.model');
const Cuisines = require('../models/cuisine.model');
const Ingredients = require('../models/ingredient.model');
const Orders = require('../models/order.model');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const Users = require('../models/user.model');
const mongooseAlgolia = require('mongoose-algolia');
router.use(express.json());

// @desc displays forms
router.get("/new", async (req, res) => {
    res.locals.atHomePage = false;
    try {
        let ingredients = await Ingredients.find();
        let cuisines = await Cuisines.find();
        res.render("breakie/new", { ingredients, cuisines });
    }
    catch(err) { console.log(err); }
})

// @desc makes an order, under
// @route under .post('/purchase)
async function makeOrder(hasPaid, body, userId) {
    try {
        let breakieId = await (await Breakies.findById(body.items.items[0].breakie));
        let order = await Orders.create({
            items: body.items.items,
            buyer: userId,
            paid: hasPaid,
            seller: breakieId.creator,
            price: body.items.price,
        });
        await Users.findByIdAndUpdate(userId, { $push: { orders: order._id }});
        await Breakies.findByIdAndUpdate(breakieId._id, { $inc: { qty: -parseInt(body.items.items[0].qty) }});
    }
    catch(err) { console.log(err); }
}

router.post("/purchase/", async(req, res) => {
    if (req.body.stripeTokenId) {
        stripe.charges.create({
            amount: parseFloat(req.body.items.price) * 100,
            source: req.body.stripeTokenId,
            currency: 'sgd'
        }).
        then( data => { 
            console.log("Payment with card successful");
            makeOrder(true, req.body, req.user._id);
        }).
        catch( err => { 
            console.log(err);
            res.status(500).end();
        });
    }
    else { makeOrder(false, req.body, req.user._id); }
    res.json({ message: "Successful"});  
})

// @desc an order has been made
router.post("/purchase/:id", async (req, res) => {
    try {
        let order = await Orders.create(req.body);
        let value = await Orders.findById(order._id).populate({
            path: "items",
            populate: { path: "breakie", model: "Breakie" }
        });
        order = await Orders.findByIdAndUpdate(order._id, { seller: value.items[0].breakie.creator });
        if (!req.body.buyerContact) await Orders.findByIdAndUpdate(order._id, { buyer: req.user._id });
        await Breakies.findByIdAndUpdate(req.params.id, { $inc: { qty: -parseInt(req.body.items[0].qty) }});
        res.redirect("/order/");
    }
    catch(err) { console.log(err); }
})

// @delete breakie by seller
router.delete("/delete/:id", async (req, res) => {
    try {
        await Breakies.findByIdAndUpdate(req.params.id, { deleted: true });
        await Breakies.SyncToAlgolia();
        await Breakies.SetAlgoliaSettings({ 
            searchableAttributes: ['name', 'desc', 'price', 'cuisine.type', 'creator', 'ingredients'] 
        });
        res.redirect("/user/list");
    }
    catch(err) { console.log(err); }
})

router.get("/edit/:id", async (req, res) => {
    res.locals.atHomePage = false;
    try {
        let ingredients = await Ingredients.find();
        let cuisines = await Cuisines.find();
        Breakies.findById(req.params.id).
        then( breakie => res.render("breakie/edit", { breakie, ingredients, cuisines })).
        catch(err => console.log(err) );    
    }
    catch(err) { console.log(err); }
})

module.exports = router;