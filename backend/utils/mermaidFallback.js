function generateFallbackMermaidGraph(studyPlan = {}, metadata = {}) {
  const weeks = studyPlan.weeks || [];
  const goal = (metadata.goal || "Study Goal").substring(0, 30).replace(/['"]/g, "");
  const weaknesses = metadata.weaknesses || [];

  const lines = [];
  lines.push("```mermaid");
  lines.push("graph TD");

  // START node
  lines.push(`    START["🚀 ${goal}"]:::startNode`);

  let prevNodeId = "START";

  weeks.forEach((week, idx) => {
    const weekNum = week.week || idx + 1;
    const weekNodeId = `W${weekNum}`;

    // Week node + edge from previous
    lines.push(`    ${weekNodeId}["📚 Week ${weekNum}"]`);
    lines.push(`    ${prevNodeId} --> ${weekNodeId}`);

    // Topic nodes (max 2 per week)
    const days = Array.isArray(week.days) ? week.days.slice(0, 2) : [];
    days.forEach((day, dayIdx) => {
      const topic = (day.topic || "Topic").substring(0, 25).replace(/['"]/g, "");
      const topicNodeId = `T${weekNum}_${dayIdx}`;
      const isWeakness = weaknesses.some(
        (w) => day.topic?.toLowerCase().includes(w.toLowerCase())
      );
      const styleClass = isWeakness ? ":::weakNode" : ":::strongNode";

      lines.push(`    ${topicNodeId}["${topic}"]${styleClass}`);
      lines.push(`    ${weekNodeId} --> ${topicNodeId}`);
    });

    prevNodeId = weekNodeId;
  });

  // FINISH node + final edge
  lines.push(`    FINISH["✅ COMPLETION"]:::finishNode`);
  lines.push(`    ${prevNodeId} --> FINISH`);

  // Class definitions - avoid ALL Mermaid reserved words (end, start, graph, etc.)
  lines.push("    classDef strongNode fill:#90EE90,stroke:#2d5016,color:#000,stroke-width:2px");
  lines.push("    classDef weakNode fill:#FFD700,stroke:#b8860b,color:#000,stroke-width:2px");
  lines.push("    classDef startNode fill:#32CD32,stroke:#006400,color:#fff,stroke-width:3px");
  lines.push("    classDef finishNode fill:#FF6347,stroke:#8B0000,color:#fff,stroke-width:3px");

  lines.push("```");

  return lines.join("\n");
}

module.exports = { generateFallbackMermaidGraph };