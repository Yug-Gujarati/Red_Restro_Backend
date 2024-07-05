const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference the User model
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  monthlyIncome: {
    type: [Number], // Array to store monthly income values (12 elements)
    required: true,
    validate: {
      validator: (monthlyIncome) => monthlyIncome.length === 12,
      message: 'Monthly income array must have 12 elements.'
    }
  }
});
const UserData = mongoose.model('IncomeData', incomeSchema);

module.exports = UserData;