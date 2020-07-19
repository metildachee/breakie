const router = require('express').Router();
const Users = require('../models/user.model');
const passport = require('../setup/ptconfig');
const bcrypt = require('bcrypt');
const axios = require('axios');

// register
router.get("/register", (req, res) => { res.render("user/register"); })

router.post("/register", async (req, res) => {
    try {
        let hash = await bcrypt.hash(req.body.password, 10);
        let user = await Users.create(req.body);
        await Users.findByIdAndUpdate(user._id, { password: hash });

        /// Geocoding from Google API --->
        axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: req.body.address,
                key: process.env.GOOGLE_API_KEY
            }
        }).
        then( value => {
            // this will give me the lat and long coordinates
            let location = value.data.results[0].geometry.location;
            console.log(location);
            const coordinates = { type: "Point", coordinates: [location.lng, location.lat] };
            Users.findByIdAndUpdate(user._id, { coordinates: coordinates }).
            then( user => { 
                console.log(user);
                res.redirect("/auth/login");
            }).
            catch( err => console.log(err) )
            console.log(newUser);
            res.redirect("/auth/login");
        }).
        catch(err => console.log(err));
        // Google API --->
        // let location = { lat: 1.3570639, lng: 103.7673642 };
    }
    catch(err) { console.log(err); }
})

router.get("/login", (req, res) => {
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
    req.logout();
    req.flash("success", "You've logged out successfully.");
    res.redirect("/");
})

module.exports = router;