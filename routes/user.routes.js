const router = require('express').Router();
const Users = require("../models/user.model");
const checkUser = require('../setup/checkUser');

// @desc displays the current user's published breakies
router.get('/list', checkUser, (req, res) => {
    res.locals.atHomePage = false;
    Users.findById(req.user._id).
    populate({
        path: "publishes",
        populate: { path: "ingredients", model: "Ingredient" }
    }).
    then( user => {
        let availBreakies = [];
        user.publishes.forEach( published => {
            if (!published.deleted) 
                availBreakies.push(published);
        })
        res.render("user/list", { breakies: availBreakies });
    }).
    catch(err => console.log(err));
})

router.get('/show/:id', (req, res) => {
    res.locals.atHomePage = false;
    Users.findById(req.params.id).
    populate({
        path: "publishes",
        populate: { path: "ingredients", model: "Ingredient" }
    }).
    then( user => {
        res.render("user/show", { user, key: process.env.GOOGLE_API_KEY });
    }).
    catch( err => console.log(err) );
})
module.exports = router;