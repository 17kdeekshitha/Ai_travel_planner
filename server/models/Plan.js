const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true
  
  },
  destination: String,
  budget: String,
  interests: [String],
  days: Number,
  response: String,
  inputHash: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Plan', planSchema);
