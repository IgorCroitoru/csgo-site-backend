const mongoose = require('mongoose');

const stickerSchema = mongoose.Schema({
    name: { type: String, unique: false, required: true },
    position: { type: String, unique: false, required: false },
    icon_img: { type: String, unique: false, required: true },
    scratch: { type: String, unique: false, required: false },
}, { _id: false }); 

const itemSchema = new mongoose.Schema({
    name: { type: String, unique: false, required: true },
    assetid: { type: String, unique: false, required: true },
    icon_url: { type: String, unique: false, required: true },
    tradable: { type: Boolean, unique: false, required: true },
    rarity: { type: String, unique: false, required: true },
    type: { type: String, unique: false, required: true },
    marketable: { type: Boolean, unique: false, required: true },
    inspect_link: { type: String, unique: false, required: false },
    name_tag: { type: String, unique: false, required: false },
    stickers: {type: [stickerSchema], default: undefined}, // Stickers field is optional
}, {_id: false});

const inventorySchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_id64: {type: String, unique: true, required: true},
    updated_date: { type: Date, default: Date.now, required: true },
    items: {type: [itemSchema], default:[]},
});

const InventoryModel = mongoose.model('Inventory', inventorySchema);

module.exports = InventoryModel;