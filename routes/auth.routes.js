const router = require('express').Router();
const Users = require('../models/user.model');
const passport = require('../setup/ptconfig');
const bcrypt = require('bcrypt');
const axios = require('axios');

router.get("/register", (req, res) => { 
    res.locals.atHomePage = false;
    res.render("user/register"); 
})

router.post("/register", async (req, res) => {
    res.locals.atHomePage = false;
    try {
        let hash = await bcrypt.hash(req.body.password, 10);
        let user = await Users.create(req.body);
        await Users.findByIdAndUpdate(user._id, { password: hash });

        axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: req.body.address,
                key: process.env.GOOGLE_SERVER_KEY
            }
        }).
        then( value => {
            let location = value.data.results[0].geometry.location;
            const coordinates = { type: "Point", coordinates: [location.lng, location.lat] };
            Users.findByIdAndUpdate(user._id, { location: coordinates }).
            then( user => { 
                res.redirect("/auth/login");
            }).
            catch( err => console.log(err) )
            res.redirect("/auth/login");
        }).
        catch(err => console.log(err));
    }
    catch(err) { console.log(err); }
})

router.get("/login", (req, res) => {
    res.locals.atHomePage = false;
    res.render("user/login");
})

router.post("/login", 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: "Invalid email/password, please try again!",
    })
);

router.get("/logout", (req, res) => {
    res.locals.atHomePage = false;
    req.logout();
    req.flash("success", "You've logged out successfully.");
    res.redirect("/");
})

module.exports = router;