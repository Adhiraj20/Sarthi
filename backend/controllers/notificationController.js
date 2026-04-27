const Notification = require("../models/Notification");
const User = require("../models/user");
const { sendNotification, sendNotifications } = require("../utils/notificationSender");

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    const unreadCount = notifications.reduce(
      (count, notification) => count + (notification.isRead ? 0 : 1),
      0
    );

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET USER NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

exports.sendManualNotification = async (req, res) => {
  try {
    const { userId, userIds, message, link = "", type = "general", sendToAll = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    if (sendToAll) {
      const users = await User.find({}, "_id");
      await sendNotifications(
        users.map((user) => user._id),
        { message, link, type }
      );

      return res.status(200).json({
        success: true,
        message: "Notification sent to all users",
      });
    }

    if (Array.isArray(userIds) && userIds.length > 0) {
      await sendNotifications(userIds, { message, link, type });

      return res.status(200).json({
        success: true,
        message: "Notification sent successfully",
      });
    }

    if (userId) {
      const notification = await sendNotification({ userId, message, link, type });

      return res.status(200).json({
        success: true,
        data: notification,
        message: "Notification sent successfully",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Provide userId, userIds, or sendToAll",
    });
  } catch (error) {
    console.error("SEND MANUAL NOTIFICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};
