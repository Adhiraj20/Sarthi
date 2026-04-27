const express = require("express");
const {
  createStudyPlan,
  adaptExistingStudyPlan,
  updateStudyPlanProgress,
} = require("../services/studyPlannerService");
const { generateMermaidStudyGraph } = require("../services/aiService");
const StudyPlan = require("../models/studyPlan");

const router = express.Router();

router.post("/study-plan", async (req, res) => {
  try {
    const { goal, duration, dailyHours, level, weaknesses } = req.body;

    const result = await createStudyPlan({
      goal,
      duration,
      dailyHours,
      level,
      weaknesses,
    });

    return res.json({
      success: true,
      planId: result.planId,
      plan: result.plan,
    });
  } catch (error) {
    console.error("Study planner error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not generate study plan",
    });
  }
});

router.put("/study-plan/:id/progress", async (req, res) => {
  try {
    const { id } = req.params;
    const { week, day, completed } = req.body;

    const result = await updateStudyPlanProgress(id, {
      week,
      day,
      completed,
    });

    return res.json({
      success: true,
      planId: result.planId,
      plan: result.plan,
    });
  } catch (error) {
    console.error("Study plan progress update error:", error);

    if (
      error.message === "Study plan not found" ||
      error.message === "Week not found" ||
      error.message === "Day not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not update study plan progress",
    });
  }
});

router.post("/study-plan/:id/adapt", async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const result = await adaptExistingStudyPlan(id, message);

    return res.json({
      success: true,
      planId: result.planId,
      plan: result.plan,
    });
  } catch (error) {
    console.error("Study plan adapt error:", error);

    if (error.message === "Study plan not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not adapt study plan",
    });
  }
});

router.post("/study-plan/:id/mermaid-graph", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Mermaid graph request for plan ID:", id);
    
    const studyPlan = await StudyPlan.findById(id);
    console.log("Study plan found:", !!studyPlan);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: "Study plan not found",
      });
    }

    console.log("Generating mermaid graph...");
    const mermaidGraph = await generateMermaidStudyGraph(studyPlan.plan, {
      goal: studyPlan.goal,
      duration: studyPlan.duration,
      dailyHours: studyPlan.dailyHours,
      level: studyPlan.level,
      weaknesses: studyPlan.weaknesses,
    });

    console.log("Graph generated successfully");
    return res.json({
      success: true,
      planId: id,
      mermaidGraph,
    });
  } catch (error) {
    console.error("Mermaid graph generation error:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Could not generate visualization: " + error.message,
    });
  }
});

module.exports = router;
