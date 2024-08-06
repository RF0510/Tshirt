const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const app = express();

const methodOverride = require('method-override');
const morgan = require('morgan');

const authController = require('./controllers/auth.js');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

mongoose.connection.on('error', (err) => {
  console.error(`Error connecting to MongoDB: ${err.message}`);
});

const Tshirt = require('./models/tshirt.js');
const User = require('./models/user.js');

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
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
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
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
    next();
  });
  
  // Your routes here
  app.get('/', async (req, res) => {
    res.render('index.ejs');
  });
  
  app.get('/tshirts', async (req, res) => {
    const allTshirts = await Tshirt.find();
    const message = req.query.message;
    res.render('tshirts/index.ejs', { tshirts: allTshirts, message });
  });
  

// Public routes
app.get('/', async (req, res) => {
  res.render('index.ejs');
});

app.get('/tshirts/new', (req, res) => {
  res.render('tshirts/new.ejs');
});

app.post('/tshirts', async (req, res) => {
  await Tshirt.create(req.body);
  res.redirect('/tshirts');
});

app.get('/tshirts', async (req, res) => {
  const allTshirts = await Tshirt.find();
  const message = req.query.message;
  res.render('tshirts/index.ejs', { tshirts: allTshirts, message });
});

app.get('/tshirts/:tshirtId', async (req, res) => {
  const foundTshirt = await Tshirt.findById(req.params.tshirtId);
  res.render('tshirts/show.ejs', { tshirt: foundTshirt });
});

// Protected routes
app.use(isAuthenticated);

app.delete('/tshirts/:tshirtId', async (req, res) => {
  await Tshirt.findByIdAndDelete(req.params.tshirtId);
  res.redirect('/tshirts');
});

app.get('/tshirts/:tshirtId/edit', async (req, res) => {
  const foundTshirt = await Tshirt.findById(req.params.tshirtId);
  res.render('tshirts/edit.ejs', {
    tshirt: foundTshirt,
  });
});

app.put('/tshirts/:tshirtId', async (req, res) => {
  await Tshirt.findByIdAndUpdate(req.params.tshirtId, req.body);
  res.redirect(`/tshirts/${req.params.tshirtId}`);
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
