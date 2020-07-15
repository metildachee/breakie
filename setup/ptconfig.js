const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Users = require("../models/user.model");

passport.serializeUser(function(user, done) { 
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    Users.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        Users.findOne({ username: username }, function(err, user) {
            if (err) { return done(err) };
            if (!user) { return done(null, false, { message: "Incorrect username." }) };
            if (!user.validatePassword(password)) { return done(null, false, { message: "Incorrect password." }) };
            return done(null, user);
        })
    }
))

module.exports = passport;