const express = require("express");
const session = require('express-session');
const User = require("../model/use");
const bcryptjs = require("bcryptjs");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const cors = require('cors');
const validator = require('validator');

authRouter.use(session({
  secret: 'yug123456789',
  resave: false,
  saveUninitialized: true
}));


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);  
};

authRouter.post("/api/signup", async (req,res)=> {
    try {   
        const { name, email, password, confirmPassword } = req.body;
    
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ status: false, status_code: 400 , message: "User with same email already exists!" });
        }  
        const hashedPassword = await bcryptjs.hash(password, 8);
        const hashedConfirmPassword = await bcryptjs.hash(confirmPassword, 8);
        if(password != confirmPassword){
          return res.status(400).json({ status: false, status_code: 400 ,message: "Password and ConfirmPassword must be same"})
        }
        
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 3600000);
        let user = new User({
          email,
          password: hashedPassword,
          confirmPassword: hashedConfirmPassword,
          name,
          otp,
          otpExpiresAt,
        });
        req.session.emailToPass = user.email; // Store email for verification
        req.session.otp = otp;  
        user = await user.save();
        res.status(200).json({data: user,status: true, status_code: 200, message: "OTP send to your email.", });
      } catch (e) {
        res.status(500).json({status: false, status_code: 500, message: "Server side error", });
      }
});
 
 
authRouter.post("/api/signin", async (req,res) => {
    try{
      const {email, password} = req.body;
      const user = await User.findOne({email});
      if(!user){
        return res
          .status(400)
          .json({status: false, status_code: 400 , message: "User with this email id does not exist!"});
      }
      const isMatch = await bcryptjs.compare(password,user.password);
      if(!isMatch){
        return res.status(400).json({status: false, status_code: 400 , message: "Incorrect password"});
      }
      if (!user.isverified) {
        return res.status(400).json({status: false, status_code: 400 , message: "User Not verified"});
      }
      const token  = jwt.sign({id: user._id}, "passwordKey");
      res.json({ token, data: user, status: true, status_code: 200, message: "User login successfully", });
    } catch (e) {
      res.status(500).json({status: false, status_code: 500, message: "Searver side error",  });
    }
});

authRouter.post("/api/forgotpassword", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: false, status_code: 400 , message: "Email Not Found" });
    }
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 3600000); 
    user.otp = otp;
    user.otpExpiresAy = otpExpiresAt;
    req.session.emailToPass = user.email; 
    req.session.otp = otp;
    await user.save();
    return res.json({ data: user, status: true, status_code: 200 , message: "OTP send to your email"});
  } catch (e) {
    res.status(500).json({ status: false, status_code: 500 , error: e.message });
  }
});

authRouter.post("/api/verify-otp", async (req, res) => {
  try {
    const { email , otp } = req.body;

    // Retrieve stored OTP from session 
    const user = await User.findOne({ email });


    if (!user) {
      return res.status(400).json({status: false, status_code: 400 , message: "User Not found ty" });
    }
   
    const now = new Date();
    if (user.verificationCodeExpiresAt < now) {
      return res.status(400).send({ status: false, status_code: 400 , message: "OTP Expired" });
    }

    if (!user.isverified) { 
      if (otp == user.otp) {
        user.isverified = true;
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        delete req.session.emailToPass;  
        delete req.session.otp;

        res.status(200).json({status: true, status_code: 200 , message: 'Email verification successful. You can now sign in.' });
      } else {
        res.status(400).json({ status: false, status_code: 400 ,message: 'Wrong verification code' });
      }
    } else { 
      if(otp == user.otp){ 
      res.status(200).json({ status: true, status_code: 201 , message: 'Verification successful. You can now reset your password.' });
      } else{
        res.status(400).json({ status: false, status_code: 400, message: 'Wrong verification code'})
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({status: false, status_code: 500,  message: 'Server error' });
  }
});

 
authRouter.post("/api/changepassword", async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;  
    const user = await User.findOne({ email });
 
    if (!user) {
      return res.status(400).json({status: false, status_code: 400,  message: "Email not found!" });
    }
 
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ status: false, status_code: 400, message: "New password and confirm password do not match!" });
    }
 
    const hashedPassword = await bcryptjs.hash(newPassword, 8);
    user.password = hashedPassword; 
    user.otp = undefined;
    await user.save();

    return res.status(200).json({ status: true, status_code: 200, message: "Password changed successfully!" });
  } catch (e) {
    res.status(500).json({ status: false, status_code: 500, message: "Searver side error" });
  }
});


module.exports = authRouter;