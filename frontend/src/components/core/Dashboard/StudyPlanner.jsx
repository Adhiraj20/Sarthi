import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import mermaid from "mermaid";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL;
const LEVELS = ["beginner", "intermediate", "advanced"];

mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });

// ── Mermaid Graph Viewer ─────────────────────────────────────────────────────
function MermaidGraphViewer({ mermaidCode }) {
  const [svgContent, setSvgContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mermaidCode) return;
    const renderDiagram = async () => {
      try {
        setError(null);
        let cleanCode = mermaidCode;
        const match = mermaidCode.match(/```mermaid\n([\s\S]*?)\n```/);
        if (match) {
          cleanCode = match[1];
        } else {
          cleanCode = mermaidCode.replace(/```mermaid\n?/g, "").replace(/\n?```/g, "").trim();
        }
        if (!cleanCode.includes("graph") && !cleanCode.includes("flowchart")) {
          throw new Error("Invalid mermaid syntax - missing graph or flowchart keyword");
        }
        const { svg } = await mermaid.render("mermaid-diagram-" + Date.now(), cleanCode);
        setSvgContent(svg);
      } catch (err) {
        setError("Failed to render graph: " + err.message);
      }
    };
    renderDiagram();
  }, [mermaidCode]);

  const handleDownloadPNG = () => {
    if (!svgContent) return;

    // Parse SVG to read its natural dimensions
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
    const svgEl = svgDoc.querySelector("svg");

    let svgWidth = 800;
    let svgHeight = 600;
    if (svgEl) {
      const vb = svgEl.getAttribute("viewBox");
      if (vb) {
        const parts = vb.split(/[\s,]+/);
        if (parts.length === 4) {
          svgWidth = parseFloat(parts[2]) || svgWidth;
          svgHeight = parseFloat(parts[3]) || svgHeight;
        }
      } else {
        svgWidth = parseFloat(svgEl.getAttribute("width")) || svgWidth;
        svgHeight = parseFloat(svgEl.getAttribute("height")) || svgHeight;
      }
    }

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;
    const ctx = canvas.getContext("2d");

    // Dark background matching app theme
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);

    // Use base64 data URL — avoids tainted canvas SecurityError entirely
    const svgBase64 =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgContent)));

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
      const link = document.createElement("a");
      link.download = "study-roadmap.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.onerror = () => {
      // Fallback: download as SVG if PNG conversion fails
      handleDownloadSVG();
    };
    img.src = svgBase64;
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.download = "study-roadmap.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  if (error) {
    return (
      <div className="bg-richblack-800 border-l-4 border-pink-500 rounded-r-xl p-6 text-richblack-200">
        <p className="text-sm text-pink-300 mb-2">⚠️ {error}</p>
        <details className="text-xs text-richblack-400 mt-2 bg-richblack-900 p-2 rounded">
          <summary>Debug Info</summary>
          <pre className="mt-2 overflow-auto max-h-40">{mermaidCode?.substring(0, 300)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Download buttons */}
      {svgContent && (
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1.5 text-xs text-richblack-200 border border-richblack-600 rounded-lg px-3 py-1.5 hover:bg-richblack-700 hover:text-yellow-50 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download SVG
          </button>
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 text-xs bg-yellow-50 text-richblack-900 rounded-lg px-3 py-1.5 hover:bg-yellow-100 font-semibold transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </button>
        </div>
      )}

      {/* Graph */}
      <div className="bg-richblack-900 border border-richblack-700 rounded-xl p-6 overflow-x-auto">
        {svgContent ? (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} className="flex justify-center" />
        ) : (
          <div className="flex items-center justify-center h-32 text-richblack-400">
            <span className="h-5 w-5 rounded-full border-2 border-yellow-50 border-t-transparent animate-spin mr-3" />
            Generating visualization…
          </div>
        )}
      </div>
    </div>
  );
}

// ── JSON Week card renderer ──────────────────────────────────────────────────
function PlanDisplay({ plan, planId, token, setPlan, onRegenerate }) {
  if (!plan || !plan.weeks || !Array.isArray(plan.weeks) || plan.weeks.length === 0) {
    return (
      <div className="bg-richblack-800 border-l-4 border-pink-500 rounded-r-xl p-6 text-richblack-200">
        <h3 className="text-lg font-bold text-pink-300 mb-2">Plan Generation Failed</h3>
        <p>No valid study plan data was returned from the AI. Please try generating it again.</p>
        <button
          onClick={onRegenerate}
          className="mt-4 rounded-lg bg-pink-500 hover:bg-pink-600 transition px-6 py-2 text-sm font-semibold text-white"
        >
          Regenerate Roadmap
        </button>
        <pre className="mt-4 text-[10px] overflow-auto text-richblack-400 max-h-40">{JSON.stringify(plan, null, 2)}</pre>
      </div>
    );
  }

  async function handleToggleProgress(weekNum, dayNum, currentCompleted) {
    if (!planId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/chat/study-plan/${planId}/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress: { week: weekNum, day: dayNum, completed: !currentCompleted },
        }),
      });
      const data = await res.json();
      if (data.success) setPlan(data.plan);
    } catch (err) {
      console.error("Error toggling progress:", err);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {plan.strategy && (
        <div className="bg-richblack-800 border-l-4 border-yellow-50 rounded-r-xl px-6 py-5 mb-2 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-richblack-300 mb-2 flex items-center gap-2">
            <span>💡</span> Strategy & Approach
          </h3>
          <p className="text-sm text-richblack-100 leading-relaxed">{plan.strategy}</p>
        </div>
      )}

      {plan.weeks.map((weekObj, idx) => (
        <div key={idx} className="bg-richblack-800 border border-richblack-700 rounded-xl px-6 py-5">
          <h2 className="text-lg font-bold text-yellow-50 mb-4 border-b border-richblack-700 pb-2">
            Week {weekObj.week}
          </h2>
          <div className="flex flex-col gap-4">
            {weekObj.days && weekObj.days.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {weekObj.days.map((dayObj, i) => (
                  <div
                    key={i}
                    className={`border border-richblack-700 rounded-lg p-4 transition ${
                      dayObj.completed ? "bg-richblack-800 border-caribbeangreen-400" : "bg-richblack-900 hover:border-richblack-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={dayObj.completed || false}
                          onChange={() => handleToggleProgress(weekObj.week, dayObj.day, dayObj.completed)}
                          className="h-5 w-5 rounded cursor-pointer accent-caribbeangreen-300"
                        />
                        <h3 className={`text-sm font-bold ${dayObj.completed ? "text-caribbeangreen-300 line-through" : "text-yellow-50"}`}>
                          Day {dayObj.day}
                        </h3>
                      </div>
                      {dayObj.estimatedTime && (
                        <span className="text-xs bg-richblack-800 text-richblack-200 px-2.5 py-1 rounded-full border border-richblack-600 font-medium shrink-0">
                          ⏱ {dayObj.estimatedTime}
                        </span>
                      )}
                    </div>
                    <div className={`flex flex-col gap-2.5 ${dayObj.completed ? "opacity-60" : ""}`}>
                      {dayObj.topic && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-richblack-400 sm:w-16 shrink-0 sm:mt-0.5">Topic</span>
                          <span className="text-sm text-richblack-5 font-medium">{dayObj.topic}</span>
                        </div>
                      )}
                      {dayObj.practice && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-richblack-400 sm:w-16 shrink-0 sm:mt-0.5">Practice</span>
                          <span className="text-sm text-richblack-200 leading-relaxed">{dayObj.practice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {weekObj.revision && (
              <div className="mt-2 border-l-2 border-yellow-50 pl-4 py-1">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-richblack-400 mb-1">Weekly Revision</h3>
                <p className="text-sm text-richblack-100 leading-relaxed">{weekObj.revision}</p>
              </div>
            )}
            {weekObj.notes && (
              <div className="mt-1 bg-richblack-700/30 rounded-lg p-3 border border-richblack-700">
                <p className="text-xs text-richblack-200">
                  <span className="font-semibold text-richblack-50">Note:</span> {weekObj.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {plan.recommendedCourses && plan.recommendedCourses.length > 0 && (
        <div className="bg-richblack-800 border border-richblack-700 rounded-xl px-6 py-5 mt-4">
          <h2 className="text-lg font-bold text-yellow-50 mb-3 border-b border-richblack-700 pb-2">
            Recommended Courses for You
          </h2>
          <div className="flex flex-col gap-3">
            {plan.recommendedCourses.map((course, idx) => (
              <div key={idx} className="bg-richblack-900 border border-richblack-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-caribbeangreen-100">{course.name}</h3>
                {course.reason && (
                  <p className="text-xs text-richblack-200 mt-1.5 leading-relaxed">{course.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function StudyPlanner() {
  const { token } = useSelector((state) => state.auth);

  const [myPlans, setMyPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);

  const [form, setForm] = useState({
    goal: "",
    duration: "",
    dailyHours: "",
    level: "beginner",
    weaknesses: "",
  });

  // "text" = text plan only | "graph" = text + graph simultaneously
  const [outputMode, setOutputMode] = useState("text");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [adaptMessage, setAdaptMessage] = useState("");
  const [adapting, setAdapting] = useState(false);

  const [mermaidGraph, setMermaidGraph] = useState(null);
  const [loadingGraph, setLoadingGraph] = useState(false);

  // Fetch past roadmaps on mount
  useEffect(() => {
    async function fetchMyPlans() {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/chat/study-plan/my-plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.plans) setMyPlans(data.plans);
      } catch (err) {
        console.error("Failed to load past plans:", err);
      }
    }
    if (token) fetchMyPlans();
  }, [token]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Fetch graph for a given planId
  async function fetchGraph(planId) {
    setLoadingGraph(true);
    setMermaidGraph(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/planner/study-plan/${planId}/mermaid-graph`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to generate graph");
      setMermaidGraph(data.mermaidGraph);
    } catch (err) {
      console.error("Graph generation error:", err);
    } finally {
      setLoadingGraph(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.goal.trim()) { setError("Goal is required."); return; }
    setError("");
    setPlan(null);
    setActivePlanId(null);
    setMermaidGraph(null);
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/chat/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to generate plan");

      setPlan(data.plan);
      setActivePlanId(data.planId);

      if (data.planId) {
        setMyPlans((prev) => [
          { _id: data.planId, goal: form.goal, duration: form.duration, level: form.level, plan: data.plan },
          ...prev,
        ]);
      }

      // If graph mode selected, fire graph fetch simultaneously (non-blocking)
      if (outputMode === "graph" && data.planId) {
        fetchGraph(data.planId);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdapt(e) {
    e.preventDefault();
    if (!adaptMessage.trim() || !activePlanId) return;
    setAdapting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/chat/study-plan/${activePlanId}/adapt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: adaptMessage }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPlan(data.plan);
      setAdaptMessage("");
    } catch (err) {
      console.error("Adapt error:", err);
      alert("Failed to adapt plan");
    } finally {
      setAdapting(false);
    }
  }

  // Manual "Generate Graph" button (shown only in text mode after plan exists)
  async function handleGenerateGraph() {
    if (!activePlanId) { alert("No active plan selected"); return; }
    fetchGraph(activePlanId);
  }

  function loadPlan(p) {
    setPlan(p.plan);
    setActivePlanId(p._id);
    setMermaidGraph(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function handleDelete(e, planId) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this roadmap?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/chat/study-plan/${planId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMyPlans((prev) => prev.filter((p) => p._id !== planId));
      if (activePlanId === planId) {
        setPlan(null);
        setActivePlanId(null);
        setMermaidGraph(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete the roadmap. Please try again.");
    }
  }

  const inputCls =
    "rounded-lg bg-richblack-700 border border-richblack-600 px-4 py-2.5 text-sm text-richblack-5 placeholder-richblack-400 outline-none focus:border-yellow-50 transition w-full";

  return (
    <div>
      {/* ── My Past Roadmaps ── */}
      {myPlans.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-richblack-5 mb-4">Your Saved Roadmaps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPlans.map((p) => (
              <div
                key={p._id}
                className={`relative border rounded-xl p-5 cursor-pointer transition ${
                  activePlanId === p._id
                    ? "bg-richblack-800 border-yellow-50 ring-1 ring-yellow-50 shadow-md shadow-yellow-50/20"
                    : "bg-richblack-800 border-richblack-700 hover:border-richblack-500"
                }`}
                onClick={() => loadPlan(p)}
              >
                <button
                  onClick={(e) => handleDelete(e, p._id)}
                  title="Delete this roadmap"
                  className="absolute top-3 right-3 text-richblack-400 hover:text-pink-400 transition p-1 rounded-lg hover:bg-richblack-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div className="flex justify-between items-start mb-2 pr-6">
                  <h3 className="font-semibold text-richblack-5 line-clamp-2">{p.goal}</h3>
                </div>
                <div className="flex gap-2 text-xs text-richblack-300">
                  <span className="bg-richblack-700 px-2 py-1 rounded">{p.duration || "Custom"}</span>
                  <span className="bg-richblack-700 px-2 py-1 rounded capitalize">{p.level || "Beginner"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-richblack-5 font-boogaloo">Generate New Roadmap</h1>
        <p className="mt-1 text-sm text-richblack-300">
          Describe your goal and get a week-by-week personalised roadmap.
        </p>
      </div>

      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-richblack-800 border border-richblack-700 rounded-xl p-6 flex flex-col gap-4 max-w-2xl"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-richblack-300">
            Goal <span className="text-pink-300 normal-case">*</span>
          </label>
          <input name="goal" value={form.goal} onChange={handleChange}
            placeholder="e.g. Master React and Node.js" className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-richblack-300">Duration</label>
            <input name="duration" value={form.duration} onChange={handleChange}
              placeholder="e.g. 4 weeks" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-richblack-300">Daily Hours</label>
            <input name="dailyHours" value={form.dailyHours} onChange={handleChange}
              type="number" min="0.5" max="24" step="0.5" placeholder="e.g. 2" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-richblack-300">Level</label>
            <select name="level" value={form.level} onChange={handleChange}
              className={`${inputCls} cursor-pointer`}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-richblack-300">
              Weaknesses / Focus Areas{" "}
              <span className="text-[10px] text-richblack-400 capitalize normal-case tracking-normal">(Optional)</span>
            </label>
            <input name="weaknesses" value={form.weaknesses} onChange={handleChange}
              placeholder="e.g. state management" className={inputCls} />
          </div>
        </div>

        {/* ── Output Mode Toggle ── */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-richblack-300">
            Output Mode
          </label>
          <div className="flex gap-3">
            {/* Text only */}
            <label
              className={`flex-1 flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition ${
                outputMode === "text"
                  ? "border-yellow-50 bg-richblack-700 ring-1 ring-yellow-50"
                  : "border-richblack-600 bg-richblack-700 hover:border-richblack-400"
              }`}
            >
              <input
                type="radio"
                name="outputMode"
                value="text"
                checked={outputMode === "text"}
                onChange={() => setOutputMode("text")}
                className="accent-yellow-50"
              />
              <div>
                <p className="text-sm font-semibold text-richblack-5">📋 Text Plan</p>
                <p className="text-[11px] text-richblack-400 mt-0.5">Week-by-week text roadmap only</p>
              </div>
            </label>

            {/* Graph + Text */}
            <label
              className={`flex-1 flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition ${
                outputMode === "graph"
                  ? "border-pink-400 bg-richblack-700 ring-1 ring-pink-400"
                  : "border-richblack-600 bg-richblack-700 hover:border-richblack-400"
              }`}
            >
              <input
                type="radio"
                name="outputMode"
                value="graph"
                checked={outputMode === "graph"}
                onChange={() => setOutputMode("graph")}
                className="accent-pink-400"
              />
              <div>
                <p className="text-sm font-semibold text-richblack-5">📊 Graph + Text</p>
                <p className="text-[11px] text-richblack-400 mt-0.5">Flowchart visualization + text plan</p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-pink-300 bg-pink-900/20 border border-pink-700 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 self-start rounded-lg bg-yellow-50 px-6 py-2.5 text-sm font-semibold text-richblack-900 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading
            ? "Generating…"
            : outputMode === "graph"
            ? "Generate Plan + Graph"
            : "Generate Study Plan"}
        </button>
      </form>

      {/* ── Loading ── */}
      {(loading || loadingGraph) && (
        <div className="mt-8 max-w-2xl flex flex-col gap-2">
          {loading && (
            <div className="flex items-center gap-3 text-richblack-300 text-sm">
              <span className="h-4 w-4 rounded-full border-2 border-yellow-50 border-t-transparent animate-spin" />
              Building your roadmap — this takes a few seconds…
            </div>
          )}
          {loadingGraph && !loading && (
            <div className="flex items-center gap-3 text-richblack-300 text-sm">
              <span className="h-4 w-4 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
              Generating graph visualization…
            </div>
          )}
        </div>
      )}

      {/* ── Result ── */}
      {plan && !loading && (
        <div className="mt-12 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-richblack-5">Your Study Roadmap</h2>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(plan, null, 2))}
              className="text-xs text-yellow-50 border border-richblack-600 rounded-lg px-3 py-1.5 hover:bg-richblack-700 transition"
            >
              Copy JSON
            </button>
          </div>

          <PlanDisplay plan={plan} planId={activePlanId} token={token} setPlan={setPlan} onRegenerate={handleSubmit} />

          {/* ── Adapt Plan ── */}
          <div className="mt-8 bg-richblack-800 border-l-4 border-caribbeangreen-300 rounded-r-xl px-6 py-5">
            <h3 className="text-md font-bold text-richblack-5 mb-2">Need to adjust your plan?</h3>
            <p className="text-sm text-richblack-200 mb-4">
              Fell behind or want to shift focus? Tell the AI to reorganize your active plan. Completed days will remain untouched!
            </p>
            <form onSubmit={handleAdapt} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={adaptMessage}
                onChange={(e) => setAdaptMessage(e.target.value)}
                placeholder="e.g. I got sick on Day 2, reschedule everything by 2 days"
                className={inputCls}
                required
              />
              <button
                type="submit"
                disabled={adapting}
                className="shrink-0 rounded-lg bg-caribbeangreen-300 px-6 py-2.5 text-sm font-semibold text-richblack-900 hover:bg-caribbeangreen-200 disabled:opacity-50 transition"
              >
                {adapting ? "Adapting..." : "Update Plan"}
              </button>
            </form>
          </div>

          {/* ── Graph Section ── */}
          <div className="mt-8 bg-richblack-800 border-l-4 border-pink-400 rounded-r-xl px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-md font-bold text-richblack-5">Study Roadmap Visualization</h3>
                <p className="text-sm text-richblack-300 mt-1">
                  {outputMode === "graph"
                    ? "Your flowchart is generated automatically with your plan"
                    : "Generate a visual flowchart of your roadmap"}
                </p>
              </div>

              {/* Show manual button only in text mode */}
              {outputMode === "text" && (
                <button
                  onClick={handleGenerateGraph}
                  disabled={loadingGraph}
                  className="shrink-0 rounded-lg bg-pink-400 px-6 py-2.5 text-sm font-semibold text-richblack-900 hover:bg-pink-500 disabled:opacity-50 transition"
                >
                  {loadingGraph ? "Generating..." : "📊 Generate Graph"}
                </button>
              )}

              {/* In graph mode show a regenerate button if graph already rendered */}
              {outputMode === "graph" && mermaidGraph && (
                <button
                  onClick={handleGenerateGraph}
                  disabled={loadingGraph}
                  className="shrink-0 text-xs text-richblack-300 border border-richblack-600 rounded-lg px-3 py-1.5 hover:bg-richblack-700 disabled:opacity-50 transition"
                >
                  {loadingGraph ? "Regenerating..." : "🔄 Regenerate"}
                </button>
              )}
            </div>

            {/* Graph loading indicator inside panel */}
            {loadingGraph && (
              <div className="flex items-center gap-3 text-richblack-400 text-sm py-6 justify-center">
                <span className="h-5 w-5 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                Building your flowchart…
              </div>
            )}

            {mermaidGraph && !loadingGraph && (
              <div className="mt-2">
                <MermaidGraphViewer mermaidCode={mermaidGraph} />
              </div>
            )}

            {/* Prompt in graph mode while graph hasn't loaded yet and not loading */}
            {outputMode === "graph" && !mermaidGraph && !loadingGraph && (
              <p className="text-sm text-richblack-400 text-center py-4">
                Graph will appear here once generated.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}