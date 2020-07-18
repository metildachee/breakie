const router = require('express').Router();
const bcrypt = require('bcrypt');
const Users = require("../models/user.model");

// @desc displays the current user's published breakies
router.get('/list', (req, res) => {
    Users.findById(req.user._id).
    populate({
        path: "publishes",
        populate: { path: "ingredients", model: "Ingredient" }
    }).
    then( breakies => {
        res.render("user/list", { breakies: breakies.publishes });
    }).
    catch(err => console.log(err));
})

module.exports = router;