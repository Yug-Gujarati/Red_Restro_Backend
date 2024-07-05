const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    required: true,
    type: String,
    trim: true,
  },
  email: {
    required: true,
    type: String,
    trim: true,
    validate: {
      validator: (value) => {
        const re =
          /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return value.match(re);
      },
      message: "Please enter a valid email address",
    },
  },
  password: {
    required: true,
    type: String,
  }, 
  otp:{
    type: String,
    expires: 120,
  },
  token:{
    type: String,
  },
  isverified:{
    type: Boolean,
    default: false,
  },
  verificationCodeExpiresAt:{
    Date,
  }
   
});


const User = mongoose.model("User", userSchema);
module.exports = User;