const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const app = express()

const methodOverride = require('method-override')
const morgan = require('morgan')

const authController = require('./controllers/auth.js')

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`)
});

mongoose.connection.on('error', (err) => {
  console.error(`Error connecting to MongoDB: ${err.message}`)
})

const Tshirt = require('./models/tshirt.js')
const User = require('./models/user.js')

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(morgan('dev'));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Passport setup
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static('public'))

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' })
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: 'Incorrect password.' })
      }
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Use the auth controller
app.use('/auth', authController);

// Authorization middleware
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

// Middleware to make the user available in all templates

app.use((req, res, next) => {
    res.locals.user = req.user;
    next()
  })

  
  
  // Your routes here
  app.get('/', async (req, res) => {
    res.render('index.ejs');
  });
  
  app.get('/tshirts', async (req, res) => {
    const allTshirts = await Tshirt.find()
    const message = req.query.message
    res.render('tshirts/index.ejs', { tshirts: allTshirts, message })
  })
  

// Public routes
app.get('/', async (req, res) => {
  res.render('index.ejs');
})


app.post('/tshirts', isAuthenticated, async (req, res) => {
  try {
    // Add the current user's ID to the T-shirt data
    const tshirt = new Tshirt({
      ...req.body,
      user: req.user._id,
    });
    await tshirt.save();
    res.redirect('/tshirts')
  } catch (err) {
    console.error(err);
    res.send("An error occurred while creating the T-shirt.");
  }
});


app.get('/tshirts', isAuthenticated, async (req, res) => {
  try {
    const userTshirts = await Tshirt.find({ user: req.user._id });
    const message = req.query.message;
    res.render('tshirts/index.ejs', { tshirts: userTshirts, message })
  } catch (err) {
    console.error(err);
    res.send("An error occurred while fetching the T-shirts.");
  }
});





// Protected routes
app.use(isAuthenticated)

app.get('/tshirts/new', (req, res) => {
    res.render('tshirts/new.ejs')
  })

app.get('/tshirts/:tshirtId', async (req, res) => {
  const foundTshirt = await Tshirt.findById(req.params.tshirtId);
  res.render('tshirts/show.ejs', { tshirt: foundTshirt });
})


app.delete('/tshirts/:tshirtId', isAuthenticated, async (req, res) => {
  try {
    const tshirt = await Tshirt.findOneAndDelete({ _id: req.params.tshirtId, user: req.user._id })
    if (!tshirt) {
      return res.status(403).send("You are not authorized to delete this T-shirt.")
    }
    res.redirect('/tshirts');
  } catch (err) {
    console.error(err);
    res.send("An error occurred while deleting the T-shirt.")
  }
})



app.get('/tshirts/:tshirtId/edit', isAuthenticated, async (req, res) => {
  try {
    const tshirt = await Tshirt.findOne({ _id: req.params.tshirtId, user: req.user._id })
    if (!tshirt) {
      return res.status(403).send("You are not authorized to edit this T-shirt.")
    }
    res.render('tshirts/edit.ejs', { tshirt });
  } catch (err) {
    console.error(err);
    res.send("An error occurred while fetching the T-shirt for editing.")
  }
});


app.put('/tshirts/:tshirtId', isAuthenticated, async (req, res) => {
  try {
    const tshirt = await Tshirt.findOneAndUpdate(
      { _id: req.params.tshirtId, user: req.user._id },
      req.body
    );
    if (!tshirt) {
      return res.status(403).send("You are not authorized to update this T-shirt.")
    }
    res.redirect(`/tshirts/${req.params.tshirtId}`)
  } catch (err) {
    console.error(err);
    res.send("An error occurred while updating the T-shirt.")
  }
});




app.listen(3000, () => {
  console.log('Listening on port 3000')
});
