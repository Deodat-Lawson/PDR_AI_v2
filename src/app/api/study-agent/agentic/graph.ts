/**
 * Study Buddy Agent Graph
 * LangGraph workflow for the agentic study assistant
 *
 * This module constructs and exports the compiled graph.
 * Node implementations are in ./nodes.ts
 * Intent detection is in ./intent-detection.ts
 * Prompts are in ./prompts.ts
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { StudyAgentStateAnnotation } from "./state";
import {
  understandNode,
  planNode,
  agentNode,
  toolNode,
  respondNode,
  shouldContinue,
} from "./nodes";

// ============================================================================
// Graph Construction
// ============================================================================

/**
 * Create the Study Buddy Agent graph
 */
export function createStudyBuddyGraph() {
  const workflow = new StateGraph(StudyAgentStateAnnotation)
    // Add nodes
    .addNode("understand", understandNode)
    .addNode("plan", planNode)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addNode("respond", respondNode)

    // Define edges
    .addEdge(START, "understand")
    .addEdge("understand", "plan")
    .addEdge("plan", "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      respond: "respond",
    })
    .addEdge("tools", "agent") // Loop back after tool execution
    .addEdge("respond", END);

  return workflow.compile();
}

// ============================================================================
// Singleton Graph Instance
// ============================================================================

/**
 * Singleton instance of the compiled graph
 */
let compiledGraph: ReturnType<typeof createStudyBuddyGraph> | null = null;

/**
 * Get or create the Study Buddy Agent graph
 */
export function getStudyBuddyGraph() {
  if (!compiledGraph) {
    compiledGraph = createStudyBuddyGraph();
  }
  return compiledGraph;
}
