const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
require('dotenv').config();
const User = require('../models/user-model');
const UserDto = require('../dtos/user-dto');

passport.use(new SteamStrategy({
    returnURL: `${process.env.FRONT_URL}/api/auth/steam/return`, // Replace with your actual return URL
    realm: `${process.env.FRONT_URL}`, // Replace with your actual realm URL
    apiKey: process.env.USER_1_API_KEY // Replace with your Steam API key
  },
  async function(identifier, profile, done) {
    const updateFields = {
      name: profile.displayName,
      avatar: profile.photos[2].value,
      // Add any other fields you want to update
    };

    try {
      let user = await User.findOneAndUpdate(
        { id64: profile.id },
        { $set: updateFields },
        { upsert: true, new: true } // Create the user if not found, return the updated document
      );

      if (!user) {
        // User was not found, create a new user
        const newUser = new User({
          id64: profile.id,
          avatar: profile.photos[2].value,
          name: profile.displayName
        });

        user = await newUser.save();
      }
      return done(null, user);
    } catch (err) {
      console.log(err)
      return done(err);
    }
  }
));

// Serialize and deserialize user (typically required)
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function(obj, done) {
  try
  {  
    const user = await User.findById(obj)
    done(null, user)

  }
  catch(err){
    done(null, null);
  }
});

module.exports = passport;
