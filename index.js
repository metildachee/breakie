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

require("dotenv").config();
let gfs;


mongoose.connect(process.env.DATABASE, {
    useNewUrlParser : true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}, (err, db) => { 
    gfs = Grid(db.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log("Mongodb connected!"); 
});

// const conn = mongoose.createConnection(process.env.DATABASE, {
//     useNewUrlParser : true,
//     useUnifiedTopology: true,
//     useFindAndModify: false,
//     useCreateIndex: true,
// });


// conn.once('open',() => {
//   // Init stream
//   gfs = Grid(conn.db, mongoose.mongo);
//   gfs.collection('uploads');
// });


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
    next();
})

app.get("/", (req, res) => {
    Breakies.find().
    populate("creator").
    then( breakies =>  {
        gfs.files.findOne({ _id: breakie.image }, (err, file) => {
            res.render("breakie/index", { breakie, file });
        })
        // res.render("breakie/index", { breakies })
    }).
    catch( err => console.log(err) );
    // console.log("i am here");
    // Breakies.find().
    // then( breakies => {
    //     console.log(breakies);
    //     res.send(breakies)
    // }).
    // catch( err => console.log(err) );
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
// CREATE NEW BREAKIE ---> 
app.post("/breakie/new", upload.single('file'), async (req, res) => {
    console.log(req.file);
    try {
        console.log(req.file.id);
        let breakie = await Breakies.create(req.body);
        if (req.file == undefined) {
            breakie = await Breakies.findByIdAndUpdate(breakie._id, { creator: req.user._id });
            console.log(`No file has been specified`);
        } else {
            breakie = await Breakies.findByIdAndUpdate(breakie._id, { creator: req.user._id, image: req.file.id });
            console.log(`File has been uploaded.`);    
        }
        console.log(breakie);
        await Users.findByIdAndUpdate(req.user._id, { $push: { made: breakie._id }});
        res.redirect("/");
    }
    catch(err) { console.log(err); }
})

// SHOWING BREAKIES  ----> 
app.get("/breakie/show/:id", (req, res) => {
    Breakies.findById(req.params.id).
    populate("creator ingredients cuisine").
    then( breakie => {
        gfs.files.findOne({ _id: breakie.image }, (err, file) => {
            res.render("breakie/show", { breakie, file })
        })
    }).
    catch(err => console.log(err) )
})

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

app.get('/image/:id', (req, res) => {
    gfs.files.findOne({ _id: req.params.id }, (err, file) => {
        console.log(file);
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

app.use("/auth", require("./routes/auth.routes.js"));
app.use("/breakie", require("./routes/breakie.routes.js"));
app.use("/order", require("./routes/order.routes.js"));
app.use("/user", require("./routes/user.routes.js"));
app.use("/", require("./routes/breakie.routes.js"));

  
app.listen(process.env.PORT, () => console.log(`Go to localhost:${process.env.PORT}`));