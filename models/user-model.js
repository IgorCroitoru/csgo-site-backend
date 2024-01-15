const {Schema, model} = require('mongoose');

const UserSchema = new Schema({
    email: {type: String, unique: false, required: false},
    id64: {type: String, required: true},
    avatar: {type: String, required:true},
    name: {type: String, required: true},
    tradeURL: {type: String},
    date_joined: { type: Date, default: Date.now, required: true },
    credits: {type: Number, required: true, default: 0},
}, {versionKey: false})

module.exports = model('User', UserSchema);