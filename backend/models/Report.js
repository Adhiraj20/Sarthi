const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },

  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },

  status: {
    type: String,
    enum: ["open", "reviewed", "resolved", "dismissed"],
    default: "open",
  },

  adminNote: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  postSnapshot: {
    title: {
      type: String,
      default: "",
    },
    topic: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Report", reportSchema);
