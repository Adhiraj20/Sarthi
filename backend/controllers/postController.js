const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const User = require("../models/user");
const { sendNotification, sendNotifications } = require("../utils/notificationSender");

const COMMUNITY_ALLOWED_TYPES = ["Student", "Instructor"];

function isCommunityAuthorised(accountType) {
  return COMMUNITY_ALLOWED_TYPES.includes(accountType);
}

function getPostQuery() {
  return Post.find({ status: "active" })
    .populate("author", "firstName lastName email image accountType")
    .populate({
      path: "comments",
      options: { sort: { createdAt: 1 } },
      populate: {
        path: "user",
        select: "firstName lastName email image accountType",
      },
    })
    .sort({ createdAt: -1 });
}

async function deletePostAndRelations(postId) {
  await Comment.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);
}

exports.createPost = async (req, res) => {
  try {
    if (!isCommunityAuthorised(req.user.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only students and instructors can create posts",
      });
    }

    const { title, topic = "", content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "title and content are required",
      });
    }

    const post = await Post.create({
      title: title.trim(),
      topic: topic.trim(),
      content: content.trim(),
      author: req.user.id,
    });

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "firstName lastName email image accountType"
    );

    const users = await User.find({ _id: { $ne: req.user.id }, active: true }, "_id");
    await sendNotifications(users.map((user) => user._id), {
      message: `New community post: ${post.title}`,
      link: "/dashboard/community",
      type: "post",
    });

    return res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create post",
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await getPostQuery();

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
    });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await Post.findById(postId);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isLiked = post.likes.some((likeId) => likeId.toString() === req.user.id);

    if (isLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("author", "firstName lastName email image accountType")
      .populate({
        path: "comments",
        options: { sort: { createdAt: 1 } },
        populate: {
          path: "user",
          select: "firstName lastName email image accountType",
        },
      });

    return res.status(200).json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error("LIKE POST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update like",
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(postId);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      text: text.trim(),
      user: req.user.id,
      post: postId,
    });

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "firstName lastName email image accountType"
    );

    return res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error("ADD COMMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isOwner = post.author.toString() === req.user.id;
    const isAdminUser = req.user.accountType === "Admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post",
      });
    }

    if (isAdminUser) {
      await Report.updateMany(
        { post: postId, status: { $in: ["open", "reviewed"] } },
        {
          $set: {
            status: "resolved",
            reviewedBy: req.user.id,
            adminNote: "Post removed by admin",
          },
        }
      );

      if (post.author.toString() !== req.user.id) {
        await sendNotification({
          userId: post.author,
          message: `Your community post "${post.title}" was removed by admin.`,
          link: "/dashboard/community",
          type: "moderation",
        });
      }
    }

    await deletePostAndRelations(postId);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete post",
    });
  }
};

exports.reportPost = async (req, res) => {
  try {
    const { postId, reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Report reason is required",
      });
    }

    const post = await Post.findById(postId).populate(
      "author",
      "firstName lastName"
    );

    if (!post || post.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const existingReport = await Report.findOne({
      post: postId,
      reportedBy: req.user.id,
      status: { $in: ["open", "reviewed"] },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this post",
      });
    }

    await Report.create({
      post: postId,
      reportedBy: req.user.id,
      reason: reason.trim(),
      postSnapshot: {
        title: post.title,
        topic: post.topic,
        content: post.content,
      },
    });

    const admins = await User.find({ accountType: "Admin", active: true }, "_id");
    await sendNotifications(admins.map((admin) => admin._id), {
      message: `A community post was reported: ${post.title}`,
      link: "/dashboard/post-reports",
      type: "report",
    });

    return res.status(200).json({
      success: true,
      message: "Reported to admin",
    });
  } catch (error) {
    console.error("REPORT POST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to report post",
    });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reportedBy", "firstName lastName email image accountType")
      .populate("reviewedBy", "firstName lastName email")
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "firstName lastName email image accountType",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("GET REPORTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch post reports",
    });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNote = "" } = req.body;

    if (!["reviewed", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report status",
      });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status,
          adminNote: adminNote.trim(),
          reviewedBy: req.user.id,
        },
      },
      { new: true }
    )
      .populate("reportedBy", "firstName lastName email image accountType")
      .populate("reviewedBy", "firstName lastName email")
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "firstName lastName email image accountType",
        },
      });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      report,
      message: "Report updated successfully",
    });
  } catch (error) {
    console.error("UPDATE REPORT STATUS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update report status",
    });
  }
};
