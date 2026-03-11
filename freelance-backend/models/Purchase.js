const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, 
  razorpay_order_id: String,
  razorpay_payment_id: String,
  amount: Number,
  status: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', purchaseSchema);