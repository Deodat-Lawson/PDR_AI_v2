/**
 * Study Buddy Agentic Chat API
 * Provides AI chat responses using the agentic workflow
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runStudyBuddyAgent } from "./orchestrator";
import type { StudyAgentRequest, StudyMode, StudyPlanItem } from "./types";

export const runtime = "nodejs";
export const maxDuration = 120; // Allow up to 2 minutes for complex workflows

/**
 * POST /api/study-agent/agentic
 * Process a message through the Study Buddy agentic workflow
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      message: string;
      mode?: StudyMode;
      fieldOfStudy?: string;
      selectedDocuments?: string[];
      studyPlan?: StudyPlanItem[];
      conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
      preferences?: {
        learningStyle?: "visual" | "auditory" | "kinesthetic" | "reading";
        preferredDifficulty?: "beginner" | "intermediate" | "advanced";
        enableWebSearch?: boolean;
        responseLength?: "brief" | "moderate" | "detailed";
      };
    };

    // Validate request
    const {
      message,
      mode = "study-buddy",
      fieldOfStudy,
      selectedDocuments,
      studyPlan,
      conversationHistory,
      preferences,
    } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("🤖 [Agentic Study Agent] Received request:");
    console.log("   Message:", message.substring(0, 100));
    console.log("   Mode:", mode);
    console.log("   Documents:", selectedDocuments?.length ?? 0);

    // Build the request
    const agentRequest: StudyAgentRequest = {
      message: message.trim(),
      mode,
      userId,
      fieldOfStudy,
      selectedDocuments,
      studyPlan,
      conversationHistory,
      preferences,
    };

    // Run the agentic workflow
    const response = await runStudyBuddyAgent(agentRequest);

    console.log("✅ [Agentic Study Agent] Response generated:");
    console.log("   Tools used:", response.toolsUsed.join(", ") || "none");
    console.log("   Processing time:", response.processingTimeMs, "ms");

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ [Agentic Study Agent] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/study-agent/agentic
 * Get information about the agentic Study Buddy capabilities
 */
export async function GET() {
  return NextResponse.json({
    name: "Study Buddy Agentic Agent",
    version: "1.0.0",
    description:
      "An AI-powered study assistant with agentic capabilities for learning support",
    modes: [
      {
        id: "teacher",
        name: "Teacher Mode",
        description:
          "Structured, lecture-style explanations with comprehension checks",
      },
      {
        id: "study-buddy",
        name: "Study Buddy Mode",
        description: "Friendly, conversational support for studying",
      },
      {
        id: "quiz-master",
        name: "Quiz Master Mode",
        description: "Interactive quizzing and knowledge testing",
      },
      {
        id: "coach",
        name: "Learning Coach Mode",
        description: "Study planning and learning strategy guidance",
      },
    ],
    capabilities: [
      {
        name: "Document Search (RAG)",
        description: "Search through uploaded documents for relevant information",
      },
      {
        name: "Flashcard Generation",
        description: "Create study flashcards from document content",
      },
      {
        name: "Quiz Generation",
        description: "Generate quizzes with multiple question types",
      },
      {
        name: "Concept Explanation",
        description: "Detailed explanations with analogies and examples",
      },
      {
        name: "Study Plan Creation",
        description: "Create personalized study schedules and plans",
      },
      {
        name: "Progress Tracking",
        description: "Track study sessions and learning progress",
      },
      {
        name: "Web Research",
        description: "Search the web for additional information",
      },
    ],
    endpoints: {
      chat: {
        method: "POST",
        path: "/api/study-agent/agentic",
        description: "Process a message through the agentic workflow",
      },
      info: {
        method: "GET",
        path: "/api/study-agent/agentic",
        description: "Get agent capabilities and information",
      },
    },
  });
}

