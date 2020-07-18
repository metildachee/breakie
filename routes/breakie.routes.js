const router = require('express').Router();
const Breakies = require('../models/breakie.model');
const Cuisines = require('../models/cuisine.model');
const Ingredients = require('../models/ingredient.model');
const Orders = require('../models/order.model');
const Users = require('../models/user.model');
const Breakie = require('../models/breakie.model');

// @desc displays forms
router.get("/new", async (req, res) => {
    try {
        let ingredients = await Ingredients.find();
        let cuisines = await Cuisines.find();
        res.render("breakie/new", { ingredients, cuisines });
    }
    catch(err) { console.log(err); }
})

// @desc an order has been purchase
router.post("/purchase/:id", async (req, res) => {
    try {
        let order = await Orders.create(req.body);
        let value = await Orders.findById(order._id).populate({
            path: "items",
            populate: { path: "breakie", model: "Breakie" }
        });
        order = await Orders.findByIdAndUpdate(order._id, { seller: value.items[0].breakie.creator });
        if (!req.body.buyerContact) await Orders.findByIdAndUpdate(order._id, { buyer: req.user._id });
        await Breakies.findByIdAndUpdate(req.params.id, { qty: req.body.qty });
        res.redirect("/");
    }
    catch(err) { console.log(err); }
})

router.delete("/delete/:id", (req, res) => {
    Breakies.findByIdAndDelete(req.params.id).
    then( breakie => {
        Orders.aggregate([{ $match: { items: breakie._id}}]).
        then( order => { $pull: { items: breakie._id }}).
        catch( err => console.log(err) );

        res.redirect("/user/list");
    }).
    catch(err => console.log(err) );
})

router.get("/edit/:id", async (req, res) => {
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