import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ChatOpenAI } from "@langchain/openai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { db } from "../../../../server/db/index";
import { pdfChunks, document, users } from "../../../../server/db/schema";
import { eq, inArray } from "drizzle-orm";

import type { EmotionTag, StudyAgentChatRequest } from "./types";
import {
  detectEmotion,
  startsWithEmotionTag,
  hasAnyEmotionTag,
  extractFirstEmotionTag,
  stripEmotionTags,
} from "./emotion";
import { ensureTrailingEllipses, extractTextContent } from "./utils";
import { getSystemPrompt } from "./prompts";

/**
 * Study Agent Chat API
 * Provides AI chat responses for the study agent with context awareness
 * Integrated with research learning agent capabilities
 */

// Research keywords for detecting research-type questions
const RESEARCH_KEYWORDS = [
  "research",
  "find",
  "learn about",
  "explore",
  "discover",
  "what is",
  "tell me about",
  "information about",
];

// Introduction keywords
const INTRO_KEYWORDS = ["introduce", "discuss the study materials", "study plan"];

/**
 * Fetch document content for selected documents
 */
async function fetchDocumentContent(
  userId: string,
  selectedDocuments: string[]
): Promise<{ content: string; titles: string[] }> {
  const documentTitles: string[] = [];
  let documentContent = "";

  try {
    const [userInfo] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!userInfo) {
      return { content: "", titles: [] };
    }

    const companyId = userInfo.companyId;
    const numericIds = selectedDocuments.map((id) => Number(id));

    const docs = await db
      .select({
        id: document.id,
        title: document.title,
      })
      .from(document)
      .where(eq(document.companyId, companyId));

    const validDocIds = docs
      .map((d) => d.id)
      .filter((id) => numericIds.includes(id));

    if (validDocIds.length === 0) {
      return { content: "", titles: [] };
    }

    const chunks = await db
      .select({
        documentId: pdfChunks.documentId,
        page: pdfChunks.page,
        content: pdfChunks.content,
      })
      .from(pdfChunks)
      .where(inArray(pdfChunks.documentId, validDocIds))
      .orderBy(pdfChunks.documentId, pdfChunks.page);

    const docMap = new Map<number, { title: string; chunks: string[] }>();

    for (const chunk of chunks) {
      if (!docMap.has(chunk.documentId)) {
        const doc = docs.find((d) => d.id === chunk.documentId);
        docMap.set(chunk.documentId, {
          title: doc?.title ?? `Document ${chunk.documentId}`,
          chunks: [],
        });
      }
      docMap.get(chunk.documentId)!.chunks.push(chunk.content);
    }

    const summaries: string[] = [];
    for (const [, docData] of docMap.entries()) {
      documentTitles.push(docData.title);
      const summary = docData.chunks.join("\n\n").substring(0, 2000);
      summaries.push(`\n\n--- ${docData.title} ---\n${summary}`);
    }

    documentContent = summaries.join("\n");
    console.log(`📄 [StudyAgent Chat API] Loaded content from ${docMap.size} documents`);

    return { content: documentContent, titles: documentTitles };
  } catch (error) {
    console.error("Error fetching document content:", error);
    return { content: "", titles: [] };
  }
}

/**
 * Process and normalize AI response for TTS
 */
function processResponseForTTS(rawScript: string): {
  scriptForTTS: string;
  displayScript: string;
  emotion: EmotionTag | null;
} {
  let scriptForTTS = ensureTrailingEllipses(rawScript.trim());

  const scriptHasAnyTag = hasAnyEmotionTag(scriptForTTS);
  const scriptStartsWithTag = startsWithEmotionTag(scriptForTTS);

  let emotion: EmotionTag | null = null;

  if (scriptStartsWithTag) {
    emotion = extractFirstEmotionTag(scriptForTTS);
  } else {
    const detected = detectEmotion(scriptForTTS) ?? "calm";
    emotion = detected;
    scriptForTTS = `[${detected}] ${scriptForTTS}`;
  }

  if (scriptHasAnyTag && !scriptStartsWithTag && !startsWithEmotionTag(scriptForTTS)) {
    scriptForTTS = `[calm] ${scriptForTTS}`;
    emotion = emotion ?? "calm";
  }

  scriptForTTS = ensureTrailingEllipses(scriptForTTS);
  const displayScript = stripEmotionTags(scriptForTTS);

  return { scriptForTTS, displayScript, emotion };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as StudyAgentChatRequest;
    const {
      message,
      mode,
      fieldOfStudy,
      selectedDocuments,
      studyPlan,
      conversationHistory,
    } = body;

    console.log("💬 [StudyAgent Chat API] Received request:");
    console.log("   Message:", message);
    console.log("   Mode:", mode);
    console.log("   Field of Study:", fieldOfStudy);
    console.log("   Selected Documents:", selectedDocuments?.length ?? 0);
    console.log("   Study Plan Items:", studyPlan?.length ?? 0);
    console.log("   Conversation History:", conversationHistory?.length ?? 0, "messages");

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Detect message intent
    const lowerMessage = message.toLowerCase();
    const needsResearch = RESEARCH_KEYWORDS.some((kw) => lowerMessage.includes(kw));
    const isIntroduction = INTRO_KEYWORDS.some((kw) => lowerMessage.includes(kw));

    // Fetch document content if needed
    let documentContent = "";
    let documentTitles: string[] = [];

    if (selectedDocuments && selectedDocuments.length > 0) {
      const result = await fetchDocumentContent(userId, selectedDocuments);
      documentContent = result.content;
      documentTitles = result.titles;
    }

    // Build docs info string
    const docsInfo =
      selectedDocuments && selectedDocuments.length > 0
        ? documentTitles.length > 0
          ? `${selectedDocuments.length} document(s): ${documentTitles.join(", ")}`
          : `${selectedDocuments.length} document(s) available`
        : "No documents selected yet";

    // Get system prompt
    const systemPrompt = getSystemPrompt(mode, {
      fieldOfStudy,
      docsInfo,
      documentContent: documentContent || undefined,
      studyPlan,
      needsResearch,
      isIntroduction,
    });

    // Build conversation messages
    const messages: (SystemMessage | HumanMessage | AIMessage)[] = [
      new SystemMessage(systemPrompt),
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      for (const msg of recentHistory) {
        if (msg.role === "user") {
          messages.push(new HumanMessage(msg.content));
        } else {
          messages.push(new AIMessage(msg.content));
        }
      }
    }

    messages.push(new HumanMessage(message));

    // Initialize OpenAI and generate response
    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      timeout: 30000,
    });

    console.log("🤖 [StudyAgent Chat API] Generating AI response...");
    const response = await chat.invoke(messages);

    const rawScript = extractTextContent(response.content).trim();
    const { scriptForTTS, displayScript, emotion } = processResponseForTTS(rawScript);

    console.log("🤖 [StudyAgent Chat API] AI response generated:");
    console.log("   TTS Script:", scriptForTTS);
    console.log("   Display Script:", displayScript);
    console.log("   Length:", scriptForTTS.length, "characters");
    console.log("   Mode:", mode);
    console.log("   Emotion (metadata):", emotion ?? "unknown");

    return NextResponse.json(
      {
        response: scriptForTTS,
        originalResponse: displayScript,
        emotion,
        mode,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in study agent chat:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
