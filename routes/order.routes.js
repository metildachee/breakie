const router = require('express').Router();
const Orders = require('../models/order.model');

// SHOW ORDERS -->
// only for logged in users
router.get("/", async (req, res) => {
    try {
        let toPrepare = await Orders.find({ seller: req.user._id }).
            populate("seller buyer").
            populate({
                path: "items",
                populate: { path: "breakie", model: "Breakie" }
            });
        let toCollect = await Orders.find({ buyer: req.user._id }).
            populate("seller").
            populate({
                path: "items",
                populate: { path: "breakie", model: "Breakie" }
            });
        console.log(toCollect);
        res.render("order/index", { toCollect, toPrepare });
    }
    catch(err) { console.log(err); }
});

router.post("/done/:id", async (req, res) => {
    try {
        await Orders.findByIdAndUpdate(req.params.id, { completed: true, paid: true });
        res.redirect("/order/");
    }
    catch(err) { console.log(err); }
})

module.exports = router;