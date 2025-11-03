const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const GoogleStrategy = require("passport-google-oauth20").Strategy
const GitHubStrategy = require("passport-github2").Strategy
const User = require("../models/User")

// Local Strategy (Email/Password)
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password")

        if (!user) {
          return done(null, false, { message: "Incorrect email or password" })
        }

        const isValidPassword = await user.comparePassword(password)

        if (!isValidPassword) {
          return done(null, false, { message: "Incorrect email or password" })
        }

        return done(null, user)
      } catch (error) {
        return done(error)
      }
    }
  )
)

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ "oauth.google.id": profile.id })

        if (!user) {
          user = new User({
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0].value,
            emailVerified: true,
            oauth: {
              google: {
                id: profile.id,
                email: profile.emails[0].value,
                picture: profile.photos[0].value,
                refreshToken: refreshToken,
              },
            },
          })
          await user.save()
        } else {
          user.oauth.google.refreshToken = refreshToken
          user.lastLogin = new Date()
          await user.save()
        }

        return done(null, { user, profile })
      } catch (error) {
        return done(error)
      }
    }
  )
)

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ "oauth.github.id": profile.id })

        if (!user) {
          const email = profile.emails?.[0]?.value || `${profile.username}@github.local`
          user = new User({
            email,
            name: profile.displayName || profile.username,
            avatar: profile.photos?.[0]?.value,
            emailVerified: !!profile.emails?.[0]?.value,
            oauth: {
              github: {
                id: profile.id,
                login: profile.username,
                avatar_url: profile.photos?.[0]?.value,
                accessToken,
              },
            },
          })
          await user.save()
        } else {
          user.oauth.github.accessToken = accessToken
          user.lastLogin = new Date()
          await user.save()
        }

        return done(null, { user, profile })
      } catch (error) {
        return done(error)
      }
    }
  )
)

// Serialize user
passport.serializeUser((obj, done) => {
  done(null, obj.user._id)
})

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error)
  }
})

module.exports = passport
