const bcrypt = require("bcrypt")
const User = require("../models/user.js")
const express = require("express")
const passport = require("passport")
const router = express.Router()

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err)
      return res.redirect('/')
    }
    res.redirect('/auth/login');
  })
})

// Sign-up GET route
router.get("/sign-up", (req, res) => {
  const message = req.query.message;
  res.render("auth/sign-up.ejs", { message, user: req.user})
})

// Sign-up POST route
router.post("/sign-up", async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ username: req.body.username })
    if (userInDatabase) {
      return res.redirect('/auth/sign-up?message=Username%20already%20taken.')
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.redirect('/auth/sign-up?message=Password%20and%20Confirm%20Password%20must%20match')
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10)
    req.body.password = hashedPassword;
    const user = await User.create(req.body)

    res.redirect(`/auth/login?message=Thanks for signing up, ${user.username}!`)
  } catch (error) {
    console.error(error)
    res.send("An error occurred during the sign-up process.")
  }
})

// Login GET route
router.get("/login", (req, res) => {
  const message = req.query.message;
  res.render("auth/login.ejs", { message, user: req.user })
})

// Login POST route
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/auth/login")
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect(`/tshirts?message=Thank You for logging in, ${user.username}!`)
    })
  })(req, res, next);
})

module.exports = router
