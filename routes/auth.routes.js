const router = require('express').Router();
const Users = require('../models/user.model');
const passport = require('../setup/ptconfig');
const bcrypt = require('bcrypt');

// register
router.get("/register", (req, res) => { res.render("user/register"); })

router.post("/register", async (req, res) => {
    try {
        let hash = await bcrypt.hash(req.body.password, 10);
        let user = await Users.create(req.body);
        await Users.findByIdAndUpdate(user._id, { password: hash });
        res.redirect("/");
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
        failureFlash: "Invalid email/password, please try again!"
    })
);

router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "You've logged out successfully.");
    res.redirect("/");
})

module.exports = router;