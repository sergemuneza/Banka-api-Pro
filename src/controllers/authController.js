/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

//SIGNUP
export const signup = async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;
  
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 12);
  
      console.log("Hashed Password Before Saving:", hashedPassword); // Debugging
  
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword, 
        role: role || "user",
      });
  
      await newUser.save();
      console.log("New User Created in DB:", newUser);
  
      res.status(201).json({
        message: "User registered successfully",
        user: { id: newUser._id, firstName, lastName, email, role: newUser.role },
        token: generateToken(newUser),
      });
    } catch (error) {
      console.error("Signup Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
 
  //SIGNIN
export const signin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      console.log("Entered Email:", email);
      console.log("Entered Password:", password);
  
      // Ensure email and password are provided
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
  
      const user = await User.findOne({ email });
  
      console.log("Fetched User from DB:", user);
  
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      console.log("Stored Hashed Password:", user.password);
      console.log("Password Match Status:", isPasswordValid);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
  
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user),
      });
    } catch (error) {
      console.error("Sign-in Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  //STAFF USER
import { generateAuthToken } from "../utils/jwtHelper.js"; 
// Create Staff (Cashier) - Admin Only
export const createStaff = async (req, res) => {
  try {
    // Ensure only admins can create staff
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { firstName, lastName, email, password } = req.body;

    // Ensure all fields are provided
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    try {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create staff user
      const staff = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "staff",
      });

      await staff.save();

      // Generate token
      const token = generateAuthToken({ id: staff._id, role: "staff" });

      res.status(201).json({
        message: "Staff account created successfully",
        user: {
          id: staff._id,
          firstName,
          lastName,
          email,
          role: "staff",
        },
        token,
      });
    } catch (hashError) {
      console.error("Password Hashing Error:", hashError);
      return res.status(500).json({ error: "Failed to hash password" });
    }
  } catch (error) {
    console.error("Create Staff Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
  
// Request Password Reset (Send Reset Token via Email)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Send email (Simulated using console.log, replace with nodemailer for real emails)
    console.log(`🔹 Password Reset Token for ${email}: ${resetToken}`);

    res.status(200).json({ message: "Password reset link sent to email", resetToken });
  } catch (error) {
    console.error("Password Reset Request Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Reset Password (Using Token)
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password Reset Error:", error);
    res.status(500).json({ error: "Invalid or expired token" });
  }
};