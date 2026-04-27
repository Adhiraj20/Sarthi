const express = require("express");

const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendManualNotification,
} = require("../controllers/notificationController");
const { auth, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/notification/send", auth, isAdmin, sendManualNotification);
router.get("/notifications", auth, getUserNotifications);
router.patch("/notifications/read-all", auth, markAllNotificationsAsRead);
router.patch("/notifications/:id/read", auth, markNotificationAsRead);

module.exports = router;
