const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./setup/ptconfig');
const flash = require('connect-flash');
const checkUser = require('./setup/checkUser');

require("dotenv").config();

mongoose.connect(process.env.DATABASE, {
    useNewUrlParser : true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}, () => { console.log("Mongodb connected!"); });

const app = express();
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true}));
app.use(methodOverride("_method"));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: true,
        resave: false,
        cookie: { maxAge: 360000 }
    })
)

app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function(req, res, next){
    res.locals.alerts = req.flash();
    res.locals.currentUser = req.user;
    next();
})

// // app.get("/ingredients/add", (req, res) => {
// //     res.render("ingredient/index");
// // })

// app.post("/ingredients/add", async (req, res) => {
//     console.log(req.body);
//     let ingredient = await Cuisines.create(req.body);
//     console.log(ingredient);
//     res.redirect("/ingredients/add");
// })

app.use("/breakie", require("./routes/breakie.routes.js"));
app.use("/", require("./routes/breakie.routes.js"));
app.use("/order", require("./routes/order.routes.js"));
app.use("/user", require("./routes/user.routes.js"));
app.use("/auth", require("./routes/auth.routes.js"));
app.listen(process.env.PORT, () => console.log(`Go to localhost:${process.env.PORT}`));