const router = require('express').Router();
const Orders = require('../models/order.model');
const Breakies = require('../models/breakie.model');

// @desc show orders
router.get("/", async (req, res) => {
    res.locals.atHomePage = false;
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
        res.render("order/index", { toCollect, toPrepare });
    }
    catch(err) { console.log(err); }
});

// @desc update when order is finished
router.post("/done/:id", async (req, res) => {
    try {
        await Orders.findByIdAndUpdate(req.params.id, { completed: true, paid: true });
        res.redirect("/order/");
    }
    catch(err) { console.log(err); }
})

// @desc buyer wants to cancel the order
router.get("/cancel/:id", async (req, res) => {
    res.locals.atHomePage = false;
    try {
        let order = await Orders.findByIdAndUpdate(req.params.id, { cancelled: true });

        for (let i = 0; i < order.items.length; i++) {
            let item = order.items[i];
            await Breakies.findByIdAndUpdate(item.breakie, { $inc: { qty: item.qty }} );
        }
        res.redirect("/order");
    }
    catch(err) { console.log(err); }
})

module.exports = router;