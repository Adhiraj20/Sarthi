# Mermaid Study Graph Feature - Fix Prompt

## Project Overview

**Project Name:** Sarthi (EdTech Platform)  
**Tech Stack:** MERN Stack (MongoDB, Express, React, Node.js)  
**Current Issue:** Mermaid graph fails to render with parse error

---

## File Structure

```
sarthi-project/
├── backend/
│   ├── server.js                    # Main Express server (PORT 5000)
│   ├── routes/
│   │   └── studyPlanner.js          # Study planner routes
│   ├── services/
│   │   └── aiService.js             # AI service (uses Groq)
│   ├── utils/
│   │   └── mermaidFallback.js       # ⭐ FALLBACK GRAPH GENERATOR (THE PROBLEM FILE)
│   └── models/
│       └── studyPlan.js             # Study plan MongoDB model
│
└── frontend/
    └── src/
        └── components/
            └── core/
                └── Dashboard/
                    └── StudyPlanner.jsx   # Frontend component
```

---

## Feature Workflow

### 1. User Creates Study Plan (Already Working)
- User fills form: goal, duration, dailyHours, level, weaknesses
- Frontend calls: `POST /api/v1/planner/study-plan`
- Backend generates JSON study plan with weeks/days/topics
- Plan saved to MongoDB

### 2. User Clicks "Generate Graph" (Broken)
- Frontend calls: `POST /api/v1/planner/study-plan/:id/mermaid-graph`
- Backend calls `generateMermaidStudyGraph()` in aiService.js
- aiService.js calls `generateFallbackMermaidGraph()` in mermaidFallback.js
- Backend returns Mermaid code string
- Frontend renders using `mermaid.render()`

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/planner/study-plan` | Create study plan |
| POST | `/api/v1/planner/study-plan/:id/mermaid-graph` | ⭐ Get Mermaid graph |

---

## The Problem

### Current Error:
```
Parse error on line 15:
...H["✅ COMPLETION"]:::end    START --> W1
Expecting 'AMP', 'COLON', 'DOWN'... got 'end'
```

### Root Cause:
The generated Mermaid code is **INVALID** - missing edges (arrows) between nodes.

### Expected Valid Mermaid:
```mermaid
graph TD
    START["🚀 react"]:::start
    W1["📚 W1"]
    START --> W1                    ← EDGE (required!)
    T1_0["Intro to React"]:::strength
    W1 --> T1_0                     ← EDGE (required!)
    W1 --> T1_1
    W2["📚 W2"]
    W1 --> W2                       ← EDGE (required!)
    FINISH["✅ DONE"]:::end
    W2 --> FINISH                   ← EDGE (required!)
    classDef strength fill:#90EE90...
```

### Current Invalid Output:
```mermaid
graph TD
    START["🚀 react"]:::start
    W1["📚 W1"]                      ← NO EDGE FROM START!
    T1_0["Intro to React"]:::strength
    T1_1["JSX"]:::strength
    W2["📚 W2"]                      ← NO EDGE FROM W1!
    ...
    FINISH["✅ DONE"]:::end
    (missing final edge too)
```

---

## Files That Need Fixing

### 1. `backend/utils/mermaidFallback.js` (PRIMARY ISSUE)
**Purpose:** Generate valid Mermaid graph code as fallback when AI fails

**Current broken code:**
```javascript
function generateFallbackMermaidGraph(studyPlan = {}, metadata = {}) {
  const weeks = studyPlan.weeks || [];
  // ... generates nodes but MISSING EDGES!
  return mermaid;
}
```

**What it MUST generate:**
- `START --> W1` edge
- `W1 --> W2`, `W2 --> W3`, etc. edges between weeks
- `W1 --> T1_0`, `W1 --> T1_1` edges from week to topics
- `W_last --> FINISH` final edge
- All nodes must be connected with arrows

### 2. `frontend/src/components/core/Dashboard/StudyPlanner.jsx`
**Purpose:** Render the Mermaid graph

**Current extraction logic (may need adjustment):**
```javascript
const match = mermaidCode.match(/```mermaid\n([\s\S]*?)\n```/);
if (match) {
  cleanCode = match[1];
}
```

---

## Test Data for Verification

**Study Plan JSON structure:**
```json
{
  "weeks": [
    {
      "week": 1,
      "days": [
        { "day": 1, "topic": "Introduction to React", "practice": "Build counter" },
        { "day": 2, "topic": "JSX and components", "practice": "Create components" }
      ]
    },
    {
      "week": 2,
      "days": [
        { "day": 1, "topic": "React hooks", "practice": "UseState hook" },
        { "day": 2, "topic": "Context API", "practice": "Create context" }
      ]
    }
  ]
}
```

**Metadata:**
```json
{
  "goal": "Learn React",
  "duration": "4 weeks",
  "dailyHours": 2,
  "level": "beginner",
  "weaknesses": ["state management"]
}
```

---

## Required Output Format

The `mermaidFallback.js` MUST generate this exact format:

```mermaid
graph TD
    START["🚀 Learn React"]:::start
    W1["📚 W1"]
    START --> W1
    T1_0["Introduction to React"]:::strength
    W1 --> T1_0
    T1_1["JSX and components"]:::strength
    W1 --> T1_1
    W2["📚 W2"]
    W1 --> W2
    T2_0["React hooks"]:::strength
    W2 --> T2_0
    T2_1["Context API"]:::strength
    W2 --> T2_1
    FINISH["✅ DONE"]:::end
    W2 --> FINISH
    classDef strength fill:#90EE90,stroke:#2d5016,color:#000
    classDef weakness fill:#FFD700,stroke:#b8860b,color:#000
    classDef start fill:#32CD32,stroke:#006400,color:#fff
    classDef end fill:#FF6347,stroke:#8B0000,color:#fff
```

**Key requirements:**
1. Every node must have an incoming edge (except START)
2. Every node must have an outgoing edge (except FINISH)
3. Use `FINISH` not `END` (END is reserved keyword in Mermaid)
4. Wrap in ```mermaid code block
5. Define classDef AFTER all nodes and edges

---

## Verification Steps

After fixing, test with:

1. Start backend: `cd backend && node server.js`
2. Create a study plan via UI
3. Click "Generate Graph"
4. Check browser console for:
   - `Response status: 200` (not 404/500)
   - Graph renders without parse error

---

## Summary for AI Fix

> Fix `backend/utils/mermaidFallback.js` to generate VALID Mermaid graph code where EVERY NODE is connected with arrows (edges). The current output is missing the `-->` edges between nodes, causing parse errors.