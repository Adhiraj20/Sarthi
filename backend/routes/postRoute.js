const express = require("express");
const { auth, isAdmin } = require("../middleware/auth");
const {
  createPost,
  getAllPosts,
  likePost,
  addComment,
  deletePost,
  reportPost,
  getAllReports,
  updateReportStatus,
} = require("../controllers/postController");

const router = express.Router();

router.get("/", auth, getAllPosts);
router.post("/create", auth, createPost);
router.post("/like", auth, likePost);
router.post("/comment", auth, addComment);
router.post("/delete", auth, deletePost);
router.post("/report", auth, reportPost);
router.get("/reports", auth, isAdmin, getAllReports);
router.patch("/reports/:reportId/status", auth, isAdmin, updateReportStatus);

module.exports = router;
