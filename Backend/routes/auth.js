const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const { UserModel } = require("../db.js");
const authMiddleware = require("../middlewares/auth");

// Signup Route
router.post("/register", async (req, res) => {
  try {
    console.log('📦 Registration request received:', req.body);
    
    // FIXED: Changed 'name' to 'fullName' to match frontend
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        message: "Please provide fullName, email, and password" 
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // Increased rounds for better security

    // Create user - FIXED: Using fullName and removed unreachable code
    const newUser = await UserModel.create({
      name: fullName,  // Map fullName to name field in database
      email,
      password: hashedPassword,
      coins: 0, // Initial coins
    });

    console.log('✅ User created successfully:', newUser.email);

    // FIXED: Single response, removed unreachable code
    return res.status(201).json({ 
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        coins: newUser.coins
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('📍 Error stack:', error.stack);
    
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Create token
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        coins: user.coins,
      },
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    console.log("Getting user profile for:", req.user._id);
    
    const user = await UserModel.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ Get user error:', error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;