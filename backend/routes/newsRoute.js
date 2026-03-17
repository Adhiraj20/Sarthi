const express = require("express");
const { getTechNews } = require("../controllers/newsController");

const router = express.Router();

router.get("/tech", getTechNews);

module.exports = router;   // ✅ CORRECT