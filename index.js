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

const http = require('http');
const { isNull, isNullOrUndefined } = require('util');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);

require("dotenv").config();

// @desc gfs and mongoose
let gfs;

mongoose.Promise = Promise;
mongoose.connect(process.env.PROD_DATABASE, {
    useNewUrlParser : true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}).
then( db => { 
    gfs = Grid(db.connection.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log("Mongodb connected!"); 
}).
catch( err => console.log(err) )

const storage = new MulterGridfsStorage({
    url: process.env.PROD_DATABASE,
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

// @desc initialise set ups
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

// const Ingredient = require('./models/ingredient.model');
// const Cuisine = require('./models/cuisine.model');

// @desc updates and gets ingredients
// app.get("/ingredients/add", (req, res) => {
//     res.render("ingredient/index");
// })

// app.post("/ingredients/add", async (req, res) => {
//     console.log(req.body);
//     try {
//         let ingredient = await Cuisine.create(req.body);
//         res.redirect("/ingredients/add");
//         console.log(ingredient);
//     }
//     catch(err) { console.log(err); }
// })
    // @desc io stuff
    let uniqueUser = {};
    let connectedUsers = {}; // userId: socketId: isAvail:
    io.on("connection", socket => {

        if (uniqueUser._id == undefined) return;
        if (!connectedUsers.hasOwnProperty(uniqueUser._id)) 
            connectedUsers[uniqueUser._id] = { socketId: socket.id, isAvail: true }; 
        console.log(connectedUsers);

        socket.on("openChat", msgObj => {
            Users.findById(msgObj.targetId).
            then( otherUser => {
                let chatLog = `${otherUser.username} is unavailable`;
                if ((connectedUsers[msgObj.targetId]) != null && connectedUsers[msgObj.targetId].isAvail) {
                    chatLog = `${otherUser.username} is available.`;
                    Users.findById(msgObj.originId).
                    then( currUser => {
                        connectedUsers[msgObj.originId].isAvail = false;
                        io.to(connectedUsers[msgObj.targetId].socketId).emit("startChat", 
                            { username: currUser.username, originId: currUser._id });
                    }).
                    catch(err => console.log(err))
                }
                io.to(socket.id).emit("chatLog", chatLog);
            }).
            catch(err => console.log(err))
        })

        socket.on("updateHeader", obj => {
            console.log("someone joined the room");
            connectedUsers[obj.originId].isAvail = false;
            io.to(connectedUsers[obj.targetId].socketId).emit("updateHeader", `${obj.username} has entered the chat.` );
        })

        socket.on("leftChat", msgObj => {
            io.to(connectedUsers[msgObj.targetId].socketId).emit("leftChat", `${msgObj.originUsername} has left the chat.`);
            connectedUsers[msgObj.targetId].isAvail = true;
        })

        socket.on("sendMsg", msg  => {
            io.to(connectedUsers[msg.targetId].socketId).emit("receiveMsg", `${msg.username}: ${msg.msg}` );
        })
})

function getKeyByValue(connectedUsers, userId) {
    return Object.keys(connectedUsers).find(key => connectedUsers[key] === userId);
}


// @desc routes that require gfs

function getSortedArray(orderArray, jumbledArray) {
    let sortedArray = []
    orderArray.forEach( ordered => {
        jumbledArray.forEach( jumbled => {
            if (jumbled._id.equals(ordered._id)) sortedArray.push(jumbled);
        })
    })
    return sortedArray;
}

// @desc displays homepage
app.get("/", async (req, res) => {
    res.locals.atHomePage = true;
    let currentPos = {};
    uniqueUser = req.user;
    if (req.user == undefined) currentPos = { lng: 103.8198, lat: 1.3521 };
    else currentPos = { lat: req.user.location.coordinates[1], lng: req.user.location.coordinates[0] };
    
    try {
        let sortedUsers, creators, sellers, breakies, order, addrBreakies, prevValue = "";
        let sortedBreakies = [], sellerDistanceArray = [], distanceArray = [], sortedSellers = [], user = null;
        
        sortedUsers = await Users.
            aggregate([{ 
                $geoNear: { 
                    near: 
                    { type: "Point", coordinates: [currentPos.lng, currentPos.lat] },
                    key: "location",
                    distanceField: "distanceField"
                }
            }])
        creators = sortedUsers.filter( user => user.publishes.length > 0 );
        sellers = await Users.find({ _id: { $in: creators }}).populate("publishes");
        sortedSellers = getSortedArray(creators, sellers);

        breakies = creators.map( creator => { return creator.publishes; }).flat();
        order = breakies;
        breakies = await Breakies.find({ _id: { $in: breakies }, deleted: false }).populate("creator ingredients cuisine");
        sortedBreakies = getSortedArray(order, breakies);

        // @desc making the params for axios get
        addrBreakies = sortedBreakies.map( breakies => { 
            return breakies.creator.location.coordinates[1].toString() + "," + breakies.creator.location.coordinates[0].toString() +"|" 
        }).join("");
        addrBreakies = addrBreakies.substring(0, addrBreakies.length - 1);

        axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins:currentPos.lat+","+currentPos.lng,
                destinations:addrBreakies, 
                key:process.env.GOOGLE_SERVER_KEY,
                mode:"walking|bicyling|bus"
            }
        }).
        then( data => {
            data.data.rows.forEach( row => {
                row.elements.forEach( value => { distanceArray.push(value.duration.text); })
            })
            prevValue = "";
            sortedBreakies.forEach( (breakie, index) => {
                if (breakie.creator.address != prevValue) 
                    sellerDistanceArray.push(distanceArray[index]);
                prevValue = breakie.creator.address;
            })
            if (res.locals.currentUser != null) user = JSON.stringify(res.locals.currentUser);
            res.render("breakie/index", { distance: distanceArray, 
                sellerDistance: sellerDistanceArray, 
                user, sellers: sortedSellers, 
                breakies: sortedBreakies, 
                key: process.env.GOOGLE_API_KEY
            });
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
            let user = (res.locals.currentUser == null) ? null : JSON.stringify(res.locals.currentUser);
            gfs.files.findOne({ _id: breakie.image }, (err, file) => {
                res.render("breakie/show", { breakie, sellerHasBankAcc, file, user, key: process.env.GOOGLE_API_KEY, stripeAPIKey: process.env.STRIPE_PUBLIC_KEY })
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
        await Breakies.SyncToAlgolia();
        await Breakies.SetAlgoliaSettings({ searchableAttributes: ['name', 'desc', 'price', 'cuisine.type', 'creator', 'ingredients'] });
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

    Breakies.find({ "_id": { $in: hitIds }, deleted: false }).
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
  
// app.listen(process.env.PORT, () => console.log(`Go to localhost:${process.env.PORT}`));
server.listen(process.env.PORT, () => console.log(`Go to localhost:${process.env.PORT}`));
