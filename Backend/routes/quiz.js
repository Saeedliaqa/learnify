const express = require("express");
const cors = require("cors");
const router = express.Router();
const auth = require("../middlewares/auth");
const axios = require("axios");
const { QuizModel,UserModel } = require("../db");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(cors());


const { v4: uuidv4 } = require("uuid"); // Add at the top
const AIMLAPI_KEY = process.env.AIML_API_KEY || "769403415b5c4ef58ababcb56d2ca7d3"; // 🔐 Move to .env in production

console.log("✅ quiz.js router file loaded");

// 🔹 Test route
router.get("/test", auth, (req, res) => {
  res.send("Quiz route is working!");
});



// router.post("/dummy-generate", auth, async (req, res) => {
//   try {
//     const dummyQuestions = [
//       {
//         question: "What is the output of 2 + 2 in JavaScript?",
//         options: ["3", "4", "5", "22"],
//         correctIndex: 1,
//       },
//       {
//         question: "Which keyword is used to define a constant in JavaScript?",
//         options: ["var", "let", "const", "define"],
//         correctIndex: 2,
//       },
//       {
//         question: "What does DOM stand for?",
//         options: ["Data Object Model", "Document Object Model", "Desktop Object Manager", "Disk Operating Model"],
//         correctIndex: 1,
//       },
//       {
//         question: "Which method is used to add an element at the end of an array?",
//         options: ["push()", "pop()", "shift()", "unshift()"],
//         correctIndex: 0,
//       },
//       {
//         question: "What does `typeof null` return in JavaScript?",
//         options: ["null", "undefined", "object", "string"],
//         correctIndex: 2,
//       }
//     ];

//     // ✅ Create a new quiz document
//     const quizDoc = await QuizModel.create({
//       userId: req.user._id,
//       quizId: uuidv4(),
//       questions: dummyQuestions,
//     });

//     // ✅ Send back quizId and only the visible fields (no correct answers)
//     const questionsToSend = dummyQuestions.map(({ question, options }) => ({
//       question,
//       options,
//     }));

//     res.status(201).json({
//       message: "Dummy quiz generated successfully.",
//       quizId: quizDoc.quizId,
//       questions: questionsToSend,
//     });
//   } catch (error) {
//     console.error("❌ Error in dummy-generate:", error.message || error);
//     res.status(500).json({ error: "Failed to create dummy quiz." });
//   }
// });


// 🔹 OLD Generate Quiz Route
// router.post("/generate", auth, async (req, res) => {
//   try {
//     const { topic } = req.body;
//     if (!topic) {
//       return res.status(400).json({ error: "Topic is required" });
//     }

//     console.log(`🔁 Generating quiz for topic: ${topic}`);

//     const prompt = `Generate 10 multiple-choice questions about "${topic}". Return them in the following JSON format (inside markdown block):

// \`\`\`json
// [
//   {
//     "question": "What is JavaScript used for?",
//     "options": ["Option A", "Option B", "Option C", "Option D"],
//     "correctIndex": 1
//   }
// ]
// \`\`\``;

//     const response = await axios.post(
//       "https://api.aimlapi.com/v1/chat/completions",
//       {
//         model: "gpt-4o",
//         messages: [{ role: "user", content: prompt }],
//         max_tokens: 2000,
//         temperature: 0.7,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${AIMLAPI_KEY}`,
//         },
//       }
//     );

//     console.log("✅ Full AI Response:\n", JSON.stringify(response.data, null, 2));

//     const rawContent = response?.data?.choices?.[0]?.message?.content || "";

//     // 🔍 Extract JSON from code block
//     const jsonStart = rawContent.indexOf("```json");
//     const jsonEnd = rawContent.lastIndexOf("```");

//     if (jsonStart === -1 || jsonEnd === -1) {
//       console.error("❌ JSON block not found in response.");
//       return res.status(500).json({ error: "AI response format unexpected." });
//     }

//     const jsonString = rawContent.substring(jsonStart + 7, jsonEnd).trim();

//     let quizArray;
//     try {
//       quizArray = JSON.parse(jsonString);
//     } catch (err) {
//       console.error("❌ Failed to parse JSON:", err.message);
//       return res.status(500).json({ error: "Failed to parse quiz data from AI." });
//     }

//     console.log("✅ Parsed Quiz Questions:\n", quizArray);

//     // Optional: Save to DB (if needed)
//     // await QuizModel.deleteMany({ userId: req.user._id });
//     // await QuizModel.create({ userId: req.user._id, questions: quizArray });

//     // 🔄 Send to frontend
//     res.status(200).json({
//       message: `Quiz generated on topic: ${topic}`,
//       questions: quizArray,
//     });
//   } catch (error) {
//     console.error("❌ Error during AI request:", error.message || error);
//     res.status(500).json({ error: "Failed to fetch quiz from AI" });
//   }
// });

const GEMINI_API_KEY = "AIzaSyDOvscpww9XdHHhNb9YHPW9ZvppLlyp_N8";

router.post("/generate", auth, async (req, res) => {
  try {
    const { topic, level } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    console.log(`🔁 Generating quiz for topic: ${topic} using Gemini API`);

    // The prompt structure is good and tells the AI to return JSON in a markdown block.
    const prompt = `Generate 10 multiple-choice questions about "${topic}" of ${level} level difficulty. Return them in the following JSON format (inside markdown block):

\`\`\`json
[
  {
    "question": "What is JavaScript used for?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1
  }
]
\`\`\``;

    // Gemini API endpoint for gemini-2.0-flash model
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await axios.post(
      geminiApiUrl,
      {
        // Gemini API uses 'contents' with 'parts' array
        contents: [{ parts: [{ text: prompt }] }],
        // max_tokens is equivalent to Gemini's 'maxOutputTokens' in generationConfig
        // However, it's often more robust to let the model generate the full JSON
        // and handle truncation/validation on your end if needed.
        // For structured output, 'responseSchema' can be used, but the prompt
        // already specifies JSON format, which is often sufficient for this use case.
        generationConfig: {
          temperature: 0.7,
          // maxOutputTokens: 2000 // Optional: can be added here if you want to limit response size
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          // No "Authorization: Bearer" header needed if API key is in URL for Gemini
        },
      }
    );

    console.log("✅ Full Gemini AI Response:\n", JSON.stringify(response.data, null, 2));

    // Gemini API response structure: response.data.candidates[0].content.parts[0].text
    const rawContent = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 🔍 Extract JSON from code block - this logic remains the same as it depends on the prompt output
    const jsonStart = rawContent.indexOf("```json");
    const jsonEnd = rawContent.lastIndexOf("```");

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("❌ JSON block not found in response.");
      return res.status(500).json({ error: "AI response format unexpected or missing JSON block." });
    }

    const jsonString = rawContent.substring(jsonStart + 7, jsonEnd).trim();

    let quizArray;
    try {
      quizArray = JSON.parse(jsonString);
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err.message);
      return res.status(500).json({ error: "Failed to parse quiz data from AI." });
    }

    console.log("✅ Parsed Quiz Questions:\n", quizArray);

    // Optional: Save to DB (if needed)
    await QuizModel.deleteMany({ userId: req.user._id });
    await QuizModel.create({ userId: req.user._id, questions: quizArray });

    // 🔄 Send to frontend
    res.status(200).json({
      message: `Quiz generated on topic: ${topic}`,
      questions: quizArray,
    });
  } catch (error) {
    console.error("❌ Error during Gemini API request:", error.response?.data || error.message || error);
    res.status(500).json({ error: "Failed to fetch quiz from AI" });
  }
});


router.post("/generate-question", async (req, res) => {
  try {
    const { topic, level = "intermediate" } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: "Topic is required" });
    }

    console.log(`🔁 Generating SINGLE question on "${topic}" (${level}) using Gemini API`);

    /* ---------- PROMPT -------------------------------------------------- */
    const prompt = `Generate ONE multiple-choice question about "${topic}" at ${level} level difficulty. Return it **inside a markdown code block** in this exact JSON shape:

\`\`\`json
{
  "question": "string",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 2
}
\`\`\``;

    /* ---------- CALL GEMINI -------------------------------------------- */
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await axios.post(
      geminiApiUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(
      "✅ Full Gemini AI Response:\n",
      JSON.stringify(geminiResponse.data, null, 2)
    );

    /* ---------- EXTRACT & PARSE JSON ----------------------------------- */
    const raw = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const start = raw.indexOf("```json");
    const end = raw.lastIndexOf("```");

    if (start === -1 || end === -1) {
      console.error("❌ JSON block not found in response.");
      return res.status(500).json({ error: "AI response missing JSON block." });
    }

    const jsonString = raw.slice(start + 7, end).trim(); // remove ```json
    let questionObj;
    try {
      questionObj = JSON.parse(jsonString);
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err.message);
      return res.status(500).json({ error: "Invalid JSON returned by AI." });
    }

    console.log("✅ Parsed question:\n", questionObj);

    /* ---------- SEND TO CLIENT ----------------------------------------- */
    return res.status(200).json({
      message: `Question generated for topic: ${topic}`,
      question: questionObj
    });
  } catch (error) {
    console.error(
      "❌ Error during Gemini API request:",
      error.response?.data || error.message || error
    );
    res.status(500).json({ error: "Failed to fetch question from AI" });
  }
});


router.post("/submit", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers array is required" });
    }

    const quiz = await QuizModel.findOne({ userId });
    if (!quiz) {
      return res.status(404).json({ error: "No quiz found for this user or it has expired." });
    }

    let score = 0;
    const results = quiz.questions.map((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) score++;
      return {
        question: q.question,
        correctIndex: q.correctIndex,
        userAnswer,
        isCorrect,
      };
    });

    const totalQuestions = quiz.questions.length;
    const passed = score >= Math.ceil(totalQuestions / 2);

    // Update coins if passed
    if (passed) {
      await UserModel.findByIdAndUpdate(userId, { $inc: { coins: score } });
    }

    // Delete quiz after evaluation
    await QuizModel.deleteOne({ userId });

    res.status(200).json({
      message: "Quiz submitted successfully",
      score,
      total: totalQuestions,
      passed,
      coinsAdded: passed ? score : 0,
      results,
    });
  } catch (err) {
    console.error("❌ Error in /submit:", err.message);
    res.status(500).json({ error: "Quiz submission failed" });
  }
});



module.exports = router;
