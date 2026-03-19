// ⭐ FIX 1: Correct model imports (remove .default)
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const { extractJSON } = require("../utils/aiHelper");


// ===============================
// CREATE QUIZ (Instructor)
// ===============================
exports.createQuiz = async (req, res) => {
  try {

    console.log("===== CREATE QUIZ START =====");

    const { title, courseId, questions } = req.body;

    console.log("Title:", title);
    console.log("CourseId:", courseId);
    console.log("Questions Count:", questions?.length);

    const quiz = await Quiz.create({
      title,
      courseId,
      questions,
      createdBy: req.user.id
    });

    console.log("Quiz created successfully:", quiz._id);

    return res.status(201).json({
      success: true,
      message: "Quiz created",
      quiz
    });

  } catch (err) {

    console.error("CREATE QUIZ ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// GET QUIZ BY COURSE
// ===============================
exports.getQuizByCourse = async (req, res) => {

  try {

    const courseId = req.params.courseId;

    console.log("===== FETCH QUIZ BY COURSE =====");
    console.log("CourseId received:", courseId);

    const quiz = await Quiz.findOne({ courseId });
    console.log("Quiz fetched:", quiz);

    if (!quiz) {

      console.log("No quiz found for this course");

      return res.status(404).json({
        success: false,
        error: "Quiz not found for this course"
      });
    }

    console.log("Quiz found:", quiz._id);

    const sanitizedQuestions = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options
    }));

    return res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        questions: sanitizedQuestions
      }
    });

  } catch (err) {

    console.error("GET QUIZ BY COURSE ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// GET QUIZ BY ID
// ===============================
exports.getQuizById = async (req, res) => {

  try {

    const quizId = req.params.id;

    console.log("Fetching quiz by ID:", quizId);

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {

      console.log("Quiz not found:", quizId);

      return res.status(404).json({
        success: false,
        error: "Quiz not found"
      });
    }

    const sanitizedQuestions = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options
    }));

    return res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        questions: sanitizedQuestions
      }
    });

  } catch (err) {

    console.error("GET QUIZ BY ID ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
//generate quiz using ai
exports.generateAIQuiz = async (req, res) => {
  try {
    const { topic, count } = req.body;

    const prompt = `
Generate ${count} MCQ questions on "${topic}".

STRICT RULES:
- Return ONLY valid JSON
- No explanation, no markdown
- Each question MUST have exactly 4 options
- correctAnswer MUST be a NUMBER (0, 1, 2, or 3)
- correctAnswer MUST match the correct option index

Format:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0
  }
]
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/free", // ✅ FREE
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    const rawText = data.choices[0].message.content;

    // 🧠 Clean + parse JSON safely
   // const questions = extractJSON(rawText);
   let questions = extractJSON(rawText);

// 🧠 Fix missing/wrong correct answers
    questions = fixQuestions(questions);

    return res.json({
      success: true,
      questions
    });

  } catch (err) {
    console.error("AI ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ===============================
// SUBMIT QUIZ
// ===============================
exports.submitQuiz = async (req, res) => {

  try {

    const { quizId, answers } = req.body;

    console.log("===== QUIZ SUBMISSION =====");
    console.log("QuizId:", quizId);
    console.log("Student:", req.user.id);

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {

      console.log("Quiz not found during submission");

      return res.status(404).json({
        success: false,
        error: "Quiz not found"
      });
    }

    const existingAttempt = await QuizResult.findOne({
      quizId,
      studentId: req.user.id
    });

    if (existingAttempt) {

      console.log("Student already attempted quiz");

      return res.status(400).json({
        success: false,
        message: "You have already attempted this quiz"
      });
    }

    let score = 0;
    const details = [];

    quiz.questions.forEach((q, idx) => {

      const selected =
        typeof answers[idx] === "number"
          ? answers[idx]
          : null;

      const isCorrect = selected === q.correctAnswer;

      if (isCorrect) score++;

      details.push({
        question: q.question,
        selectedOption: selected,
        correctOption: q.correctAnswer,
        isCorrect
      });

    });

    const result = await QuizResult.create({
      quizId,
      studentId: req.user.id,
      score,
      totalQuestions: quiz.questions.length,
      studentAnswers: details
    });

    console.log("Quiz submitted successfully:", result._id);

    return res.json({
      success: true,
      message: "Quiz submitted",
      score,
      total: quiz.questions.length,
      resultId: result._id,
      details
    });

  } catch (err) {

    console.error("QUIZ SUBMIT ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.getSubjects = async (req, res) => {
  try {

    console.log("Fetching quiz subjects");

    const subjects = await Quiz.distinct("subject");

    return res.json({
      success: true,
      subjects
    });

  } catch (err) {

    console.error("GET SUBJECTS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.getQuizzesBySubject = async (req, res) => {
  try {

    const subject = req.params.subject;

    console.log("Fetching quizzes for subject:", subject);

    const quizzes = await Quiz.find({ subject }).select("title createdAt");

    return res.json({
      success: true,
      quizzes
    });

  } catch (err) {

    console.error("GET QUIZZES BY SUBJECT ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.getStudentResults = async (req, res) => {

  try {

    console.log("Fetching student quiz results");

    const results = await QuizResult.find({
      studentId: req.user.id
    })
      .populate("quizId", "title")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      results
    });

  } catch (err) {

    console.error("GET STUDENT RESULTS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// function to fix questions with missing/wrong correct answers
function fixQuestions(questions) {
  return questions.map((q) => {
    // Ensure options exist
    if (!q.options || q.options.length !== 4) {
      q.options = ["Option A", "Option B", "Option C", "Option D"];
    }

    // Fix correctAnswer
    if (
      q.correctAnswer === undefined ||
      q.correctAnswer < 0 ||
      q.correctAnswer > 3
    ) {
      // fallback → random correct answer
      q.correctAnswer = Math.floor(Math.random() * 4);
    }

    return q;
  });
}
