const express = require("express");
const router = express.Router();

const { handleResumeAnalysis } = require("../controllers/recommendationController");

router.post("/recommend", handleResumeAnalysis);

module.exports = router;