const router = require('express').Router();
const Breakies = require('../models/breakie.model');
const Cuisines = require('../models/cuisine.model');
const Ingredients = require('../models/ingredient.model');
const Orders = require('../models/order.model');
const Users = require('../models/user.model');

// @desc displays forms
router.get("/new", async (req, res) => {
    try {
        let ingredients = await Ingredients.find();
        let cuisines = await Cuisines.find();
        res.render("breakie/new", { ingredients, cuisines });
    }
    catch(err) { console.log(err); }
})

// @desc updates order
router.post("/purchase/:id", async (req, res) => {
    console.log(req.body);
    try {
        let order = await Orders.create(req.body);
        let value = await Orders.findById(order._id).populate({
            path: "items",
            populate: { path: "breakie", model: "Breakie" }
        });
        console.log(value);
        order = await Orders.findByIdAndUpdate(order._id, { seller: value.items[0].breakie.creator });
        if (!req.body.buyerContact) await Orders.findByIdAndUpdate(order._id, { buyer: req.user._id });
        res.redirect("/");
    }
    catch(err) { console.log(err); }
})

router.delete("/delete/:id", (req, res) => {
    Breakies.findByIdAndDelete(req.params.id).
    then( breakie => {
        // // remove it from the current owner 
        // Users.findById(req.user._id).
        // then( user => { $pull: { publishes: breakie._id }} ).
        // catch( err => console.log(err) );
        // // remove it from all orders
        Orders.aggregate([{ $match: { items: breakie._id}}]).
        then( order => { $pull: { items: breakie._id }}).
        catch( err => console.log(err) );

        res.redirect("/user/list");
    }).
    catch(err => console.log(err) );
})
module.exports = router;