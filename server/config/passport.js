const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const GoogleStrategy = require("passport-google-oauth20").Strategy
const GitHubStrategy = require("passport-github2").Strategy
const User = require("../models/User")

// Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password")
        if (!user) return done(null, false, { message: "Incorrect email or password" })
        const isValid = await user.comparePassword(password)
        if (!isValid) return done(null, false, { message: "Incorrect email or password" })
        return done(null, user)
      } catch (error) {
        return done(error)
      }
    }
  )
)

// Google OAuth Strategy — only passes profile, controller handles find/create/link
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || "http://localhost:3001"}/auth/google/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        // Pass raw profile to controller — no DB writes here
        done(null, { profile, refreshToken })
      }
    )
  )
}

// GitHub OAuth Strategy — only passes profile, controller handles find/create/link
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || "http://localhost:3001"}/auth/github/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        // Pass raw profile + token to controller — no DB writes here
        done(null, { profile, accessToken })
      }
    )
  )
}

// Serialize/deserialize for session (used only during OAuth redirect flow)
passport.serializeUser((obj, done) => {
  // obj may be a User doc (local) or { profile, ... } (OAuth)
  const id = obj._id || obj.profile?.id
  done(null, { type: obj._id ? "user" : "oauth", id, raw: obj })
})

passport.deserializeUser(async (data, done) => {
  if (data.type === "user") {
    try {
      const user = await User.findById(data.id)
      done(null, user)
    } catch (error) {
      done(error)
    }
  } else {
    // OAuth in-flight — restore raw object
    done(null, data.raw)
  }
})

module.exports = passport
