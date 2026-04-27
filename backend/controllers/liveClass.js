const Course = require("../models/course");
const User = require("../models/user");
const mailSender = require("../utils/mailSender");

exports.startLiveClass = async (req, res) => {
  try {
    const { courseId } = req.body;

    console.log("📡 StartLiveClass API hit");
    console.log("➡️ CourseId:", courseId);

    if (!courseId) {
      console.log("❌ No courseId provided");
      return res.status(400).json({
        success: false,
        message: "CourseId is required",
      });
    }

    // 1. Generate Room ID
    const roomId = `sarthi_${Date.now()}`;
    console.log("🏠 Generated Room ID:", roomId);

    // 2. Find Course
    const course = await Course.findById(courseId);

    if (!course) {
      console.log("❌ Course not found");
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    console.log(`📚 Course found: ${course.courseName}`);

    // 3. Update Course Status
    course.isLive = true;
    course.liveRoomId = roomId;
    await course.save();

    console.log("✅ Course marked as LIVE");

    // 4. Fetch Students from User Model
    const students = await User.find({ courses: courseId });

    console.log(`👥 Students fetched: ${students.length}`);

    // 5. Send Emails
    try {
      const emailPromises = students.map((student) => {
        console.log(`📧 Sending mail to: ${student.email}`);

        return mailSender(
          student.email,
          "🚀 Live Class Started - Join Now!",
          `
          <h2>Hello ${student.firstName}</h2>
          <p>Your class <b>${course.courseName}</b> is now LIVE.</p>
          <p><b>Room ID:</b> ${roomId}</p>
          <p>Click below to join:</p>
          <a href="http://localhost:3000/join/${roomId}">Join Class</a>
          `
        );
      });

      await Promise.all(emailPromises);

      console.log("✅ All emails sent successfully");

    } catch (mailError) {
      console.log("⚠️ Email sending failed:", mailError.message);
    }

    return res.status(200).json({
      success: true,
      roomId,
      message: "Live class started & emails sent",
    });

  } catch (error) {
    console.error("❌ Error in startLiveClass:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start live class",
      error: error.message,
    });
  }
};


exports.endLiveClass = async (req, res) => {
  try {
    const { courseId } = req.body;

    console.log("🛑 EndLiveClass API hit");
    console.log("➡️ CourseId:", courseId);

    if (!courseId) {
      console.log("❌ No courseId provided");
      return res.status(400).json({
        success: false,
        message: "CourseId is required",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      console.log("❌ Course not found");
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    course.isLive = false;
    course.liveRoomId = null;
    await course.save();

    console.log(`✅ Live class ended for: ${course.courseName}`);

    return res.status(200).json({
      success: true,
      message: "Class ended",
    });

  } catch (error) {
    console.error("❌ Error in endLiveClass:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to end class",
      error: error.message,
    });
  }
};