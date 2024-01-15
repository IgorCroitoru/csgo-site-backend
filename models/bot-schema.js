const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  _id: Number,       // Custom _id field as a number
  id64: String,      // A field to store SteamID64 as a string
  online: Boolean,   // A field to indicate whether the bot is online (true/false)
});

const Bot = mongoose.model('Bot', botSchema);

module.exports = Bot;
