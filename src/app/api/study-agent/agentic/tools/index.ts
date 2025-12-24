/**
 * Study Buddy Agent Tools Index
 * Exports all available tools for the agentic workflow
 */

// RAG and Research Tools
export { ragSearchTool, executeRAGSearch } from "./rag-search";
export { webResearchTool, performWebResearch } from "./web-research";

// Content Generation Tools
export { flashcardTool, generateFlashcards } from "./UNUSED_flashcard-generator";
export { quizTool, generateQuiz } from "./UNUSED_quiz-generator";
export { conceptExplainerTool, explainConcept } from "./UNUSED_concept-explainer";

// Planning and Tracking Tools
export { studyPlanTool, createOrUpdateStudyPlan } from "./study-plan";
export { progressTrackerTool, trackProgress } from "./UNUSED_progress-tracker";

// Task and Time Management Tools
export { taskManagerTool, manageTasks } from "./UNUSED_task-manager";
export { pomodoroTool, managePomodoro } from "./pomodoro-timer";

// Note-Taking Tools
export { noteTakingTool, manageNotes } from "./note-taking";

import { ragSearchTool } from "./rag-search";
import { flashcardTool } from "./UNUSED_flashcard-generator";
import { quizTool } from "./UNUSED_quiz-generator";
import { conceptExplainerTool } from "./UNUSED_concept-explainer";
import { studyPlanTool } from "./study-plan";
import { progressTrackerTool } from "./UNUSED_progress-tracker";
import { webResearchTool } from "./web-research";
import { taskManagerTool } from "./UNUSED_task-manager";
import { pomodoroTool } from "./pomodoro-timer";
import { noteTakingTool } from "./note-taking";

/**
 * All available tools for the Study Buddy Agent
 */
export const studyBuddyTools = [
  // Core learning tools
  ragSearchTool,
  flashcardTool,
  quizTool,
  conceptExplainerTool,
  
  // Planning and tracking
  studyPlanTool,
  progressTrackerTool,
  
  // Task and time management
  taskManagerTool,
  pomodoroTool,
  
  // Notes and research
  noteTakingTool,
  webResearchTool,
];

/**
 * Tool registry for quick lookup
 */
export const toolRegistry = new Map(
  studyBuddyTools.map((tool) => [tool.name, tool])
);

/**
 * Tool categories for organization
 */
export const toolCategories = {
  learning: ["rag_search", "generate_flashcards", "generate_quiz", "explain_concept"],
  planning: ["create_study_plan", "track_progress"],
  productivity: ["manage_tasks", "pomodoro_timer"],
  notes: ["take_notes", "web_research"],
};
