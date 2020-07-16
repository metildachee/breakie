const router = require('express').Router();
const Breakies = require('../models/breakie.model');
const Cuisines = require('../models/cuisine.model');
const Ingredients = require('../models/ingredient.model');
const Orders = require('../models/order.model');
const Order = require('../models/order.model');

// SHOW ALL BREAKIES --->

router.get("/", (req, res) => {
    Breakies.find().
    populate("creator").
    then( breakies => res.render("breakie/index", { breakies })).
    catch( err => console.log(err) );
})

// RENDERS FORM FOR NEW BREAKIE ---->
router.get("/new", async (req, res) => {
    try {
        let ingredients = await Ingredients.find();
        let cuisines = await Cuisines.find();
        res.render("breakie/new", { ingredients, cuisines });
    }
    catch(err) { console.log(err); }
})

// STORING DATA FROM BREAKIE FORM ---->
router.post("/new", async (req, res) => {
    try {
        let breakie = await Breakies.create(req.body);
        breakie = await Breakies.findByIdAndUpdate(breakie._id, { creator: req.user._id });
        await Users.findByIdAndUpdate(req.user._id, { $push: { made: breakie_id }});
        res.redirect("/");
    }
    catch(err) { console.log(err); }
})


router.get("/show/:id", (req, res) => {
    Breakies.findById(req.params.id).
    populate("creator ingredients cuisine").
    then( breakie => res.render("breakie/show", { breakie })).
    catch(err => console.log(err) )
})

router.post("/purchase/:id", (req, res) => {
    // this button is pressed when the person wants to purchase
    // an order should be made
    // we will assume to be a cash purchase for now
    // if the person is logged in, then this list will be added in their order
    // otherwise, their email will be logged down
    // order will also be added to the seller

//     let breakie = Breakies.findById(req.params.id);
//     Orders.create({ buyerEmail})
    console.log(req.body);
    if (req.body.buyerContact) {
        console.log("this person did not login");
    }
    else {
        console.log("this person logged in");
    }
    res.redirect("/");
    console.log("I have redirected");
})
module.exports = router;