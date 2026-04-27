const express = require("express");
const router = express.Router();

const { getPublicCourse } = require("../controllers/publicCourseController");

// 🔓 PUBLIC ROUTE (NO AUTH)
router.get("/public/course/:id", getPublicCourse);

module.exports = router;