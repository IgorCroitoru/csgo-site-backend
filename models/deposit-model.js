const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
    //name: { type: String, unique: false, required: true },
    assetid: { type: String, unique: false, required: true },
}, {_id: false});



const depositSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    transactionId: { type: Number, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: {type: Number, required: false},
    botID: {type: Number,  default: undefined},
    botID64 : {type: String, required: true},
    offerID: {type: Number,  default: undefined},
    state: {type: Number,  default: undefined},
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now, required: true },
    items: {type: [itemSchema], default: undefined},
})

depositSchema.pre('save', async function (next) {
    if (!this.transactionId) {
        const maxTransaction = await this.constructor.findOne({}, { transactionId: 1 }).sort({ transactionId: -1 });

        // If there are existing documents, increment the maximum transactionId by 1
        this.transactionId = maxTransaction ? maxTransaction.transactionId + 1 : 1;
    }
    next();
});
const DepositModel = mongoose.model('Deposit', depositSchema);
module.exports = DepositModel