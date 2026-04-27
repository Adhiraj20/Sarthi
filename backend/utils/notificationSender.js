const Notification = require("../models/Notification");

async function sendNotification({ userId, message, link = "", type = "general" }) {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!message || !message.trim()) {
    throw new Error("message is required");
  }

  const notification = await Notification.create({
    user: userId,
    message: message.trim(),
    link: link || "",
    type,
  });

  return notification;
}

async function sendNotifications(users = [], payload = {}) {
  const uniqueUserIds = [...new Set(users.map((userId) => userId?.toString()).filter(Boolean))];

  if (!uniqueUserIds.length) {
    return [];
  }

  return Promise.all(
    uniqueUserIds.map((userId) =>
      sendNotification({
        userId,
        message: payload.message,
        link: payload.link,
        type: payload.type,
      })
    )
  );
}

module.exports = {
  sendNotification,
  sendNotifications,
};
