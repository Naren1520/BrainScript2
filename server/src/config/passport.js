// server/src/config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config(); // Ensure env variables are loaded

// ✅ Conditionally configure Google OAuth only if variables are present
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.CLIENT_URL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.CLIENT_URL}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              picture: profile.photos?.[0]?.value,
            });
            await user.save();
          } else {
            await user.updateLoginTime();
          }

          return done(null, user);
        } catch (err) {
          console.error("❌ Error in GoogleStrategy:", err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️  Google OAuth credentials not configured. OAuth login will be disabled."
  );
}

// Store only user.id in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieve full user from DB by id
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error("❌ Error in deserializeUser:", err);
    done(err, null);
  }
});

export default passport;
