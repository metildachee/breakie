module.exports = function(req, res, next) {
    if (!req.user) {
        req.flash("error", "You need to login to access this page.")
        res.redirect("/auth/login");
    }
    else { next(); }
}