const router = require('express').Router();
const bcrypt = require('bcrypt');
const Users = require("../models/user.model");

router.get("/", (req, res) => {
    res.send("I am in user page");
})


module.exports = router;