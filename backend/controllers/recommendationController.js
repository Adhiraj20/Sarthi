const Course = require("../models/course");
const mailSender = require("../utils/mailSender");
const courseEmailTemplate = require("../mail/templates/courseRecommendationEmail");

// ─────────────────────────────────────────────
// 1.  SKILL ALIASES  (canonical → [aliases])
// ─────────────────────────────────────────────
const SKILL_ALIASES = {
  js:         ["javascript", "js", "ecmascript", "es6", "es2015"],
  node:       ["node", "node.js", "nodejs"],
  react:      ["react", "reactjs", "react.js"],
  mongodb:    ["mongodb", "mongo"],
  express:    ["express", "expressjs", "express.js"],
  html:       ["html", "html5"],
  css:        ["css", "css3", "scss", "sass"],
  docker:     ["docker", "containerization", "containers"],
  kubernetes: ["kubernetes", "k8s", "kubectl"],
  aws:        ["aws", "amazon web services", "ec2", "s3", "lambda", "cloud"],
  linux:      ["linux", "unix", "bash", "shell", "ubuntu", "centos"],
  git:        ["git", "github", "gitlab", "version control"],
  terraform:  ["terraform", "iac", "infrastructure as code"],
  "ci/cd":    ["ci/cd", "cicd", "jenkins", "github actions", "gitlab ci", "pipelines"],
  python:     ["python", "py", "python3"],
  java:       ["java", "jdk", "spring", "springboot"],
  dsa:        ["dsa", "data structures", "algorithms", "leetcode", "competitive programming", "cp"],
  sql:        ["sql", "mysql", "postgresql", "postgres", "database"],
};

// Reverse map: alias → canonical
const aliasToCanonical = {};
Object.entries(SKILL_ALIASES).forEach(([canonical, aliases]) => {
  aliases.forEach(alias => {
    aliasToCanonical[alias.toLowerCase()] = canonical;
  });
});

const normalizeSkill = (raw) => {
  const key = raw.toLowerCase().trim();
  return aliasToCanonical[key] || key;          // fallback: keep as-is
};

// ─────────────────────────────────────────────
// 2.  ROLE → REQUIRED SKILLS
// ─────────────────────────────────────────────
const ROLE_SKILLS = {
  "Full Stack Developer":  ["html", "css", "js", "react", "node", "mongodb", "express"],
  "Frontend Developer":    ["html", "css", "js", "react"],
  "Backend Developer":     ["node", "express", "mongodb"],
  "DevOps Engineer":       ["linux", "docker", "kubernetes", "aws", "ci/cd", "terraform", "git"],
};

// ─────────────────────────────────────────────
// 3.  SCORE a single course against missing skills
//     Uses canonical matching on tags + description keywords
// ─────────────────────────────────────────────
const scoreCourse = (course, missingSkills) => {
  // Normalize every tag to canonical form
  const normalizedTags = (course.tag || []).map(t => normalizeSkill(t));

  // Also tokenize description for extra signal
  const descWords = (course.courseDescription || "")
    .toLowerCase()
    .split(/[\s,.()\-/]+/)
    .map(w => aliasToCanonical[w] || w);

  const allSignals = new Set([...normalizedTags, ...descWords]);

  let score = 0;
  const matchedSkills = [];

  missingSkills.forEach(skill => {
    if (allSignals.has(skill)) {
      score += 10;           // strong: tag/description direct match
      matchedSkills.push(skill);
    } else {
      // Partial: check if any alias of the skill appears
      const aliases = SKILL_ALIASES[skill] || [];
      const descText = (course.courseDescription || "").toLowerCase();
      const nameText = (course.courseName || "").toLowerCase();

      const partialHit = aliases.some(a =>
        descText.includes(a) || nameText.includes(a)
      );
      if (partialHit) {
        score += 4;          // weaker signal
        matchedSkills.push(`~${skill}`);
      }
    }
  });

  return { score, matchedSkills };
};

// ─────────────────────────────────────────────
// 4.  EMAIL DEDUP  (in-memory; swap for Redis in prod)
// ─────────────────────────────────────────────
const recentEmailsSent = new Map();   // key: `${email}:${jobTitle}`, value: timestamp

const shouldSendEmail = (email, jobTitle) => {
  const key = `${email}:${jobTitle}`;
  const last = recentEmailsSent.get(key);
  const COOLDOWN_MS = 5 * 60 * 1000;   // 5-minute cooldown

  if (last && Date.now() - last < COOLDOWN_MS) {
    console.log(`⏳ Email suppressed (cooldown) for ${key}`);
    return false;
  }
  recentEmailsSent.set(key, Date.now());
  return true;
};

// ─────────────────────────────────────────────
// 5.  MAIN CONTROLLER
// ─────────────────────────────────────────────
exports.handleResumeAnalysis = async (req, res) => {
  try {
    const { jobTitle, ats, email, name } = req.body;

    console.log("\n===== NEW REQUEST =====");
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("💼 Job Title:", jobTitle);
    console.log("📋 Raw Skills:", ats?.skills);

    // ── 5a. Parse & normalize extracted skills ──────────────────
    const rawSkills = Array.isArray(ats?.skills) ? ats.skills : [];

    const extractedSkills = [
      ...new Set(
        rawSkills
          .flatMap(skill => {
            // Split compound strings like "React, Node.js" → ["React","Node.js"]
            if (typeof skill !== "string") return [];
            return skill.split(/[,/|]+/).map(s => s.trim());
          })
          .filter(s => s.length > 0 && s.length < 40)
          .map(normalizeSkill)
      ),
    ];

    console.log("🧠 Normalized Skills:", extractedSkills);

    // ── 5b. Compute missing skills ──────────────────────────────
    const requiredSkills = ROLE_SKILLS[jobTitle] || [];

    if (requiredSkills.length === 0) {
      console.warn("⚠️  Unknown jobTitle:", jobTitle);
    }

    const missingSkills = requiredSkills.filter(
      s => !extractedSkills.includes(s)
    );

    const weakAreas = missingSkills.map(s => s.toUpperCase());
    console.log("❌ Missing Skills:", missingSkills);

    // ── 5c. Fetch & score courses ───────────────────────────────
    const courses = await Course.find({ status: "Published" });

    const validCourses = courses.filter(
      c => c.courseName && !c.courseName.includes("__LOAD__")
    );

    const scoredCourses = validCourses
      .map(course => {
        const { score, matchedSkills } = scoreCourse(course, missingSkills);
        return {
          _id: course._id,
          courseName: course.courseName,
          thumbnail: course.thumbnail,
          price: course.price,
          score,
          matchedSkills,
          link: `${process.env.FRONTEND_URL || "http://localhost:5173"}/public/course/${course._id}`,
        };
      })
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);

    const recommendedCourses = scoredCourses.slice(0, 3);

    console.log(
      "🏆 Recommendations:",
      recommendedCourses.map(c => `${c.courseName} (score: ${c.score}, matched: ${c.matchedSkills})`)
    );

    // ── 5d. Readiness score ─────────────────────────────────────
    const readiness = requiredSkills.length > 0
      ? Math.round((1 - missingSkills.length / requiredSkills.length) * 100)
      : 100;

    // ── 5e. Send email (with dedup) ─────────────────────────────
    if (email && shouldSendEmail(email, jobTitle)) {
      try {
        const body = courseEmailTemplate({
          name: name || "Student",
          weakAreas,
          courses: recommendedCourses,
        });

        await mailSender(
          email,
          "Your Skill Gap & Course Recommendations 🎯",
          body
        );
        console.log("✅ Email sent to:", email);
      } catch (err) {
        console.error("❌ Email error:", err.message);
      }
    }

    // ── 5f. Response ────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: { weakAreas, recommendedCourses, readiness },
    });

  } catch (error) {
    console.error("❌ CONTROLLER ERROR:", error);
    return res.status(500).json({ success: false, message: "Recommendation failed" });
  }
};