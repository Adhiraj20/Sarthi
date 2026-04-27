const express = require("express");
const router = express.Router();

const { startLiveClass } = require("../controllers/liveClass");

router.post("/start", startLiveClass);
//router.post("/end", endLiveClass);

module.exports = router;