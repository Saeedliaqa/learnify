require("dotenv").config();
const { Router } = require("express");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth.js");
const quizRoutes = require("./routes/quiz.js");

const app = express();

const authMiddleware = require("./middlewares/auth.js");

app.use(cors({     // cross origion resource sharing rizwan dhaikh laina dobara isy 
  origin: true,        // Allows any origin (like app.use(cors()) but with more control)
  credentials: true,   // Allows cookies, authorization headers, etc.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'], // Headers that client can access
  optionsSuccessStatus: 200 // For legacy browser support
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));


app.get("/test", (req,res)=>{
  res.status(201).json({ message: "You are hitting the end point" });
})

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);



const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
