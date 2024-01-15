const mongoose = require('mongoose');


const CounterModel = mongoose.model('TransactionCounter', new mongoose.Schema({
    name: String, // Use a unique name for each counter
    count: Number,
  }));
  
  // Define the generateTransaction static method on CounterModel
  CounterModel.statics.generateTransaction = async function () {
    const counterName = 'transaction';
    const update = { $inc: { count: 1 } };
    const options = { new: true, upsert: true };
  
    const doc = await this.findOneAndUpdate({ name: counterName }, update, options);
  
    return doc.count;
  };  
  // Usage: Generate unique transaction IDs
 