import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";


// ===============================
// CREATE QUIZ (Instructor)
// ===============================
export const createQuiz = async (req, res) => {
  try {

    const { title, courseId, questions } = req.body;

    const quiz = await Quiz.create({
      title,
      courseId,
      questions,
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: "Quiz created",
      quiz
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// GET ALL SUBJECTS
// ===============================
export const getSubjects = async (req, res) => {
  try {

    const subjects = await Quiz.distinct("subject");

    return res.json({
      success: true,
      subjects
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// GET QUIZZES BY SUBJECT
// ===============================
export const getQuizzesBySubject = async (req, res) => {
  try {

    const subject = req.params.subject;

    const quizzes = await Quiz.find({ subject })
      .select("title createdAt");

    return res.json({
      success: true,
      quizzes
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// GET QUIZ BY ID
// ===============================
export const getQuizById = async (req, res) => {
  try {

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      console.error(`Quiz with ID ${req.params.id} not found`);
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
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// GET QUIZ BY COURSE
// ===============================
export const getQuizByCourse = async (req, res) => {
  try {

    const courseId = req.params.courseId;

    const quiz = await Quiz.findOne({ courseId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found for this course"
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
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// SUBMIT QUIZ
// ===============================
export const submitQuiz = async (req, res) => {
  try {

    const { quizId, answers } = req.body;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
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

    return res.json({
      success: true,
      message: "Quiz submitted",
      score,
      total: quiz.questions.length,
      resultId: result._id,
      details
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ===============================
// GET STUDENT QUIZ RESULTS
// ===============================
export const getStudentResults = async (req, res) => {
  try {

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
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};