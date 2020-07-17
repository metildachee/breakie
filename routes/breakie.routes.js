const router = require('express').Router();
const Breakies = require('../models/breakie.model');
const Cuisines = require('../models/cuisine.model');
const Ingredients = require('../models/ingredient.model');
const Orders = require('../models/order.model');
const Users = require('../models/user.model');
const upload = require('../setup/upload');

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

// CREATE NEW BREAKIE --->
router.post("/new", async (req, res) => {

    try {
        await upload(req, res); // upload the photo
        
        console.log(req.file.id);

        let breakie = await Breakies.create(req.body);
        if (req.file == undefined) {
            breakie = await Breakies.findByIdAndUpdate(breakie._id, { creator: req.user._id });
            console.log(`No file has been specified`);
        } else {
            breakie = await Breakies.findByIdAndUpdate(breakie._id, { creator: req.user._id, image: req.file.id });
            console.log(`File has been uploaded.`);    
        }
        console.log(breakie);
        await Users.findByIdAndUpdate(req.user._id, { $push: { made: breakie._id }});
        res.redirect("/");
    }
    catch(err) { console.log(err); }
})

// SHOWING BREAKIES  ----> 
router.get("/show/:id", (req, res) => {
    Breakies.findById(req.params.id).
    populate("creator ingredients cuisine").
    then( breakie => res.render("breakie/show", { breakie })).
    catch(err => console.log(err) )
})

// PLACE ORDERS --->
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

module.exports = router;