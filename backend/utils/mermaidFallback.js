function generateFallbackMermaidGraph(studyPlan = {}, metadata = {}) {
  const weeks = studyPlan.weeks || [];
  const goal = (metadata.goal || "Study Goal").substring(0, 30).replace(/['"]/g, "");
  const weaknesses = metadata.weaknesses || [];

  let lines = [];
  lines.push('```mermaid');
  lines.push('graph TD');
  lines.push(`    START["🚀 START: ${goal}"]:::start`);

  // Collect node and edge lines separately
  const nodeLines = [];
  const edgeLines = [];

  // Add week nodes and edges
  weeks.forEach((week, idx) => {
    const weekNum = week.week || idx + 1;
    const weekLabel = `📚 Week ${weekNum}`;
    const weekNodeId = `W${weekNum}`;
    nodeLines.push(`    ${weekNodeId}["${weekLabel}"]`);

    // Connect to previous week or start
    if (idx === 0) {
      edgeLines.push(`    START --> ${weekNodeId}`);
    } else {
      const prevWeek = weeks[idx - 1];
      const prevWeekNum = prevWeek.week || idx;
      edgeLines.push(`    W${prevWeekNum} --> ${weekNodeId}`);
    }

    // Add 1-2 topics per week
    if (week.days && week.days.length > 0) {
      week.days.slice(0, 2).forEach((day, dayIdx) => {
        const topic = (day.topic || "Topic").substring(0, 25).replace(/['"]/g, "");
        const dayId = `D${weekNum}_${dayIdx}`;
        // Check if this is a weakness topic
        const isWeakness = weaknesses.some((w) =>
          day.topic?.toLowerCase().includes(w.toLowerCase())
        );
        nodeLines.push(`    ${dayId}["${topic}"]${isWeakness ? ":::weakness" : ":::strength"}`);
        edgeLines.push(`    ${weekNodeId} --> ${dayId}`);
      });
    }
  });

  // End node (define before any edge points to it)
  nodeLines.push(`    END["✅ COMPLETION"]:::end`);
  // Edge from last week to END
  const lastWeekNum = weeks.length > 0 ? (weeks[weeks.length - 1].week || weeks.length) : 1;
  edgeLines.push(`    W${lastWeekNum} --> END`);

  // Add all node lines, then all edge lines
  lines = lines.concat(nodeLines);
  lines = lines.concat(edgeLines);

  // Add class definitions
  lines.push('    classDef strength fill:#90EE90,stroke:#2d5016,color:#000,stroke-width:2px');
  lines.push('    classDef weakness fill:#FFD700,stroke:#b8860b,color:#000,stroke-width:2px');
  lines.push('    classDef start fill:#32CD32,stroke:#006400,color:#fff,stroke-width:3px');
  lines.push('    classDef end fill:#FF6347,stroke:#8B0000,color:#fff,stroke-width:3px');
  lines.push('```');

  return lines.join('\n');
}

module.exports = { generateFallbackMermaidGraph };
