const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./setup/ptconfig');
const flash = require('connect-flash');
const checkUser = require('./setup/checkUser');
const Breakies = require('./models/breakie.model');
const Users = require('./models/user.model');
const Grid = require('gridfs-stream');
const multer = require('multer');
const bodyParser = require('body-parser');
const MulterGridfsStorage = require('multer-gridfs-storage');
const axios = require('axios');
const algoliasearch = require('algoliasearch');

require("dotenv").config();
let gfs;

mongoose.connect(process.env.PROD_DATABASE, {
    useNewUrlParser : true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}, (err, db) => { 
    gfs = Grid(db.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log("Mongodb connected!"); 
});

const storage = new MulterGridfsStorage({
    url: process.env.DATABASE,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
          const filename = file.originalname;
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
      });
    }
});

const upload = multer({ storage });

const app = express();
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true}));
app.use(methodOverride("_method"));
app.use(bodyParser.json());

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
    res.locals.atHomePage = true;
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

//// ----------- ALL ROUTES THAT REQUIRE GFS ---------
var currentPos;
//@desc gets current position of user
app.post("/", (req, res) => {
    currentPos = { lat: parseFloat(req.body.lat), lng: parseFloat(req.body.lng) };
    console.log("thats all for now");
})

// @desc displays homepage
app.get("/", async (req, res) => {
    res.locals.atHomePage = true;
    // @bug need to fix this part where lat and long should actually come from the server
    if (currentPos == undefined) {
        console.log("current pos is undefined");
        currentPos = { lat: 1.3525, lng: 103.9447 };
    } else {
        console.log(currentPos + " is updated");
    }
    try {
        let sortedUsers = await Users.
            aggregate([{ 
                $geoNear: { 
                    near: 
                    { type: "Point", coordinates: [currentPos.lng, currentPos.lat] },
                    key: "location",
                    distanceField: "distanceField"
                }
            }])
        let creators = sortedUsers.filter( user => user.publishes.length > 0 );
        let sellers = await Users.find({ _id: { $in: creators }}).populate("publishes");
        let breakies = creators.map( creator => { return creator.publishes; });
        breakies = breakies.flat();
        let order = breakies;
        breakies = await Breakies.find({ _id: { $in: breakies }}).populate("creator ingredients cuisine");
        let sortedBreakies = [];
        order.forEach( no => {
            breakies.forEach( breakie => {
                if (breakie._id.equals(no)) sortedBreakies.push(breakie);
            })
        })
        // @desc get distance
        // @google_api
        let addrBreakies = sortedBreakies.map( breakies => { 
            return breakies.creator.location.coordinates[1].toString() + "," + breakies.creator.location.coordinates[0].toString() +"|" 
        }).join("");
        addrBreakies = addrBreakies.substring(0, addrBreakies.length - 1);
        
        let distanceArray = [];
        // @google_api
        axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins:currentPos.lat+","+currentPos.lng,
                destinations:addrBreakies, 
                mode: "walking|bicyling|bus",
                key: process.env.GOOGLE_API_KEY
            }
        }).
        then( data => {
            data.data.rows.forEach( row => {
                row.elements.forEach( value => { distanceArray.push(value.duration.text); })
            })
            res.render("breakie/index", { distance: distanceArray, sellers: JSON.stringify(sellers), breakies: sortedBreakies, key: process.env.GOOGLE_API_KEY });
        } ).
        catch(err => console.log(err) );
    }
    catch(err) { console.log(err); }
})

// @desc creates new breakies
app.post("/breakie/new", upload.single('file'), async (req, res) => {
    try {
        let breakie = await Breakies.create(req.body);
        
        if (req.file == undefined) breakie = await Breakies.findByIdAndUpdate(breakie._id, { creator: req.user._id });
        else breakie = await Breakies.findByIdAndUpdate(breakie._id, { creator: req.user._id, image: req.file.filename });
        await Users.findByIdAndUpdate(req.user._id, { $push: { publishes: breakie._id }});

        await Breakies.SyncToAlgolia();
        await Breakies.SetAlgoliaSettings({ searchableAttributes: ['name', 'desc', 'price', 'cuisine.type', 'creator', 'ingredients'] });
        res.redirect("/");
    }
    catch(err) { console.log(err); }
})

// @desc shows individual breakies
app.get("/breakie/show/:id", (req, res) => {
    res.locals.atHomePage = false;
    Breakies.findById(req.params.id).
    populate("creator ingredients cuisine").
    then( breakie => {
        Users.findById(breakie.creator._id).
        then( seller => {
            let sellerHasBankAcc = (seller.bankAcc == null) ? false : true;
            gfs.files.findOne({ _id: breakie.image }, (err, file) => {
                res.render("breakie/show", { breakie, sellerHasBankAcc, file, user: JSON.stringify(res.locals.currentUser), key: process.env.GOOGLE_API_KEY, stripeAPIKey: process.env.STRIPE_PUBLIC_KEY })
            })
        })
    }).
    catch(err => console.log(err) )
})

// @desc shows imagefiles
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } 
        else res.status(404).json({ err: 'Not an image' });
    });
});

// @desc updates breakie file with form data
app.post('/breakie/update/:id', checkUser, upload.single('file'), async (req, res) => {
    res.locals.atHomePage = false;
    Breakies.findByIdAndUpdate(req.params.id, req.body).
    then( async breakie => {
        if (req.file != undefined) await Breakies.findByIdAndUpdate(req.params.id, { image: req.file.filename });
        res.redirect(`/breakie/show/${breakie._id}`);
    }).
    catch( err => console.log(err) );
})

const client = algoliasearch('73KCNG918X', 'ca6e613de216883f20c2f6a51675b9bb');
const breakie = client.initIndex('breakie');

//@desc accepting search post request, redirect to a home page with searches
app.post("/search", async (req, res) => {
    let hitIds = [];
    await breakie.search(req.body.search).then(({ hits }) => {
        for (let i = 0; i < hits.length; i++)
            hitIds.push(hits[i].id);
    });
    Breakies.find({ "_id": { $in: hitIds } }).
    populate("creator ingredients cuisine").
    then( breakies => {
        res.render("breakie/search", { breakies, search: req.body.search });
    }).
    catch( err => console.log(err) );
})

app.use("/auth", require("./routes/auth.routes.js"));
app.use("/breakie", checkUser, require("./routes/breakie.routes.js"));
app.use("/order", checkUser, require("./routes/order.routes.js"));
app.use("/user", require("./routes/user.routes.js"));
app.use("/", require("./routes/breakie.routes.js"));
  
app.listen(process.env.PORT, () => console.log(`Go to localhost:${process.env.PORT}`));