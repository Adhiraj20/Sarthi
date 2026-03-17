const express = require("express");
const { auth, isInstructor, isStudent } = require("../middleware/auth.js");

const {
  createQuiz,
  getSubjects,
  getQuizzesBySubject,
  getQuizById,
  submitQuiz,
  getStudentResults,
  getQuizByCourse,
  generateAIQuiz 
} = require("../controllers/quizController.js");

const router = express.Router();

router.post("/create", auth, isInstructor, createQuiz);
router.get("/course/:courseId", auth, isStudent, getQuizByCourse);
router.get("/subjects", auth, getSubjects);
router.get("/by-subject/:subject", auth, isStudent, getQuizzesBySubject);
router.post("/submit", auth, isStudent, submitQuiz);
router.get("/results", auth, isStudent, getStudentResults);
router.get("/:id", auth, isStudent, getQuizById);
router.post("/generate-ai", auth, isInstructor, generateAIQuiz);
//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

module.exports = router;