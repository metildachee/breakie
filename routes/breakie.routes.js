const router = require('express').Router();
const Breakies = require('../models/breakie.model');
const Cuisines = require('../models/cuisine.model');
const Ingredients = require('../models/ingredient.model');
const Breakie = require('../models/breakie.model');

router.get("/", (req, res) => {
    Breakies.find().
    populate("creator").
    then( breakies => res.render("breakie/index", { breakies })).
    catch( err => console.log(err) );
})

router.get("/new", async (req, res) => {
    try {
        let ingredients = await Ingredients.find();
        let cuisines = await Cuisines.find();
        res.render("breakie/new", { ingredients, cuisines });
    }
    catch(err) { console.log(err); }
})

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
        Breakie.findById(req.params.id).
        populate("creator ingredients cuisine").
        then( breakie => res.render("breakie/show", { breakie }));
})
module.exports = router;