const Course = require("../models/course");

exports.getPublicCourse = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🌍 Public course request:", id);

    const course = await Course.findById(id)
      .populate("instructor", "firstName lastName")
      .populate("category", "name");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // 🧠 Send LIMITED data only (important)
    const publicCourse = {
      _id: course._id,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      price: course.price,
      instructor: course.instructor,
      category: course.category,
      whatYouWillLearn: course.whatYouWillLearn,
      ratingAndReviews: course.ratingAndReviews
    };

    return res.status(200).json({
      success: true,
      data: publicCourse
    });

  } catch (error) {
    console.error("❌ Public course error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course"
    });
  }
};