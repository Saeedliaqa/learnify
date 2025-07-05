const mongoose = require("mongoose");
const { nanoid } = require("nanoid");           // <── NEW

/* ---------------- User ------------------ */
const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coins:    { type: Number, default: 0 }
});

/* ---------------- Quiz ------------------ */
const QuizSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // auto-generate a short, URL-safe id (12 chars) — no validation errors!
  quizId:   { type: String, unique: true, default: () => nanoid(12) },

  questions: [
    {
      question:     { type: String, required: true },
      options:      [{ type: String, required: true }],
      correctIndex: { type: Number, required: true }
    }
  ],

  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL 10 min
});

const UserModel = mongoose.model("User", UserSchema);
const QuizModel = mongoose.model("Quiz", QuizSchema);

module.exports = { UserModel, QuizModel };
