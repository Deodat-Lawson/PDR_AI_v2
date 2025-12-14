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

/**
 * Study Agent Chat API
 * Provides AI chat responses for the study agent with context awareness
 * Integrated with research learning agent capabilities
 */

/**
 * ElevenLabs supports:
 * happy, sad, angry, fearful, surprised, disgusted, excited, calm
 */
type EmotionTag =
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "surprised"
  | "disgusted"
  | "excited"
  | "calm";

/**
 * Detect emotion from text content for ElevenLabs TTS emotion tags
 * Returns emotion tag like "happy", "excited", "calm", "sad", etc.
 */
function detectEmotion(text: string): EmotionTag | null {
  const lowerText = text.toLowerCase();

  // Happy indicators - positive, encouraging, celebratory
  const happyPatterns = [
    "great",
    "excellent",
    "wonderful",
    "amazing",
    "fantastic",
    "awesome",
    "congratulations",
    "well done",
    "perfect",
    "brilliant",
    "outstanding",
    "good job",
    "nice work",
    "you got it",
    "that's right",
    "exactly",
  ];

  // Excited indicators - enthusiastic, energetic
  const excitedPatterns = [
    "let's",
    "let us",
    "ready to",
    "excited",
    "can't wait",
    "awesome",
    "brilliant",
    "here we go",
    "let me show you",
    "check this out",
  ];

  // Calm indicators - reassuring, supportive, patient
  const calmPatterns = [
    "don't worry",
    "it's okay",
    "take your time",
    "no problem",
    "that's fine",
    "no rush",
    "relax",
    "breathe",
    "step by step",
    "let's take it slow",
    "you're doing fine",
  ];

  // Empathetic/Sad indicators - comforting, understanding
  const sadPatterns = [
    "i understand",
    "i'm sorry",
    "that's okay",
    "it's alright",
    "don't worry about it",
    "that happens",
    "it's normal",
  ];

  // Check for patterns (order matters - more specific first)
  for (const pattern of excitedPatterns) {
    if (lowerText.includes(pattern)) {
      console.log(`😊 [Emotion Detection] Excited detected from: "${pattern}"`);
      return "excited";
    }
  }

  for (const pattern of happyPatterns) {
    if (lowerText.includes(pattern)) {
      console.log(`😊 [Emotion Detection] Happy detected from: "${pattern}"`);
      return "happy";
    }
  }

  for (const pattern of calmPatterns) {
    if (lowerText.includes(pattern)) {
      console.log(`😌 [Emotion Detection] Calm detected from: "${pattern}"`);
      return "calm";
    }
  }

  for (const pattern of sadPatterns) {
    if (lowerText.includes(pattern)) {
      console.log(`😔 [Emotion Detection] Sad (empathetic) detected from: "${pattern}"`);
      return "sad";
    }
  }

  // Check for exclamation marks with positive words (excited/happy)
  if (
    text.includes("!") &&
    (lowerText.includes("yes") ||
      lowerText.includes("right") ||
      lowerText.includes("correct") ||
      lowerText.includes("good"))
  ) {
    console.log(`😊 [Emotion Detection] Happy detected from exclamation`);
    return "happy";
  }

  console.log(`😐 [Emotion Detection] No emotion detected, using neutral voice`);
  return null;
}

/**
 * TTS “speech script” contract + styles
 * - Model writes a spoken script with inline emotion tags
 * - We keep emotion detection as a fallback (prefix a tag if model forgot)
 * - We also ensure the script ends with "..." to slow down TTS slightly
 */
const speechInstruction = `
OUTPUT (STRICT):
- Return ONLY a spoken script as plain text with emotion tags like [happy] [sad] [angry] [fearful] [surprised] [disgusted] [excited] [calm].
- NO markdown. NO JSON. NO bullet characters.
- Use emotion tags inline, exactly in this set (lowercase only):
  [happy] [sad] [angry] [fearful] [surprised] [disgusted] [excited] [calm]
- Have at least one emotion tag in the script for every 2-3 sentences.
- Use trailing dots "..." often to create natural pauses (about once every 1 to 2 sentences).
- Keep sentences short, clear, and easy to read aloud.
- Do NOT claim you accessed or read documents unless their actual content is provided.
- If documents are available, you may mention they exist... and invite the student to paste an excerpt.

`;

const teacherStyle = `
VOICE (TEACHER LECTURE):
- Calm, confident, and structured... like a good lecturer.
- Use a whiteboard vibe in spoken language (e.g., “On the board...” “Let’s write this down...”).
- Teach step-by-step... define terms... build intuition... then apply.
- Encourage gently... but keep authority and clarity.
- End with one quick comprehension check question.
`;

const buddyStyle = `
VOICE (STUDY BUDDY):
- Friendly, casual, supportive... like a peer studying together.
- Motivational... but still accurate.
- Suggest small next steps (a quick plan, a mini drill, a recap).
- Active ask how the student is feeling and what they are working on.
`;

interface StudyAgentChatRequest {
  message: string;
  mode: "teacher" | "study-buddy";
  fieldOfStudy?: string;
  selectedDocuments?: string[];
  studyPlan?: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }>;
  conversationHistory?: Array<{
    role: "user" | "teacher" | "buddy";
    content: string;
  }>;
}

function summarizePlan(studyPlan?: StudyAgentChatRequest["studyPlan"]) {
  if (!studyPlan || studyPlan.length === 0) return "No study plan yet";
  const done = studyPlan.filter((i) => i.completed).length;
  return `${studyPlan.length} item(s)... ${done} completed`;
}

function startsWithEmotionTag(text: string): boolean {
  return /^\s*\[(happy|sad|angry|fearful|surprised|disgusted|excited|calm)\]/i.test(
    text
  );
}

function hasAnyEmotionTag(text: string): boolean {
  return /\[(happy|sad|angry|fearful|surprised|disgusted|excited|calm)\]/i.test(
    text
  );
}

function extractFirstEmotionTag(text: string): EmotionTag | null {
  const m = text.match(
    /^\s*\[(happy|sad|angry|fearful|surprised|disgusted|excited|calm)\]/i
  );
  return m ? (m[1].toLowerCase() as EmotionTag) : null;
}

function stripEmotionTags(text: string): string {
  // Remove tags but keep the rest readable for UI display
  const without = text.replace(
    /\s*\[(happy|sad|angry|fearful|surprised|disgusted|excited|calm)\]\s*/gi,
    " "
  );
  return without.replace(/\s+/g, " ").trim();
}

function ensureTrailingEllipses(text: string): string {
  const t = text.trimEnd();
  return t.endsWith("...") ? t : `${t}...`;
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: StudyAgentChatRequest = await request.json();
    const {
      message,
      mode,
      fieldOfStudy,
      selectedDocuments,
      studyPlan,
      conversationHistory,
    } = body;

    // Log incoming request
    console.log("💬 [StudyAgent Chat API] Received request:");
    console.log("   Message:", message);
    console.log("   Mode:", mode);
    console.log("   Field of Study:", fieldOfStudy);
    console.log("   Selected Documents:", selectedDocuments?.length || 0);
    console.log("   Study Plan Items:", studyPlan?.length || 0);
    console.log(
      "   Conversation History:",
      conversationHistory?.length || 0,
      "messages"
    );

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Check if message requires research (light heuristic)
    const researchKeywords = [
      "research",
      "find",
      "learn about",
      "explore",
      "discover",
      "what is",
      "tell me about",
      "information about",
    ];
    const needsResearch = researchKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    // Check if this is an introduction request
    const isIntroduction =
      message.toLowerCase().includes("introduce") ||
      message.toLowerCase().includes("discuss the study materials") ||
      message.toLowerCase().includes("study plan");

    // Fetch document content if documents are selected
    let documentContent = "";
    let documentTitles: string[] = [];
    
    if (selectedDocuments && selectedDocuments.length > 0) {
      try {
        // Get user info to verify company access
        const [userInfo] = await db
          .select()
          .from(users)
          .where(eq(users.userId, userId));

        if (userInfo) {
          const companyId = userInfo.companyId;
          
          // Convert string IDs to numbers
          const numericIds = selectedDocuments.map((id: string | number) => Number(id));

          // Verify documents belong to user's company
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

          if (validDocIds.length > 0) {
            // Fetch chunks for valid documents
            const chunks = await db
              .select({
                documentId: pdfChunks.documentId,
                page: pdfChunks.page,
                content: pdfChunks.content,
              })
              .from(pdfChunks)
              .where(inArray(pdfChunks.documentId, validDocIds))
              .orderBy(pdfChunks.documentId, pdfChunks.page);

            // Group chunks by document and create summaries
            const docMap = new Map<number, { title: string; chunks: string[] }>();
            
            for (const chunk of chunks) {
              if (!docMap.has(chunk.documentId)) {
                const doc = docs.find((d) => d.id === chunk.documentId);
                docMap.set(chunk.documentId, {
                  title: doc?.title || `Document ${chunk.documentId}`,
                  chunks: [],
                });
              }
              docMap.get(chunk.documentId)!.chunks.push(chunk.content);
            }

            // Create summaries (first 2000 chars of each document)
            const summaries: string[] = [];
            for (const [docId, docData] of docMap.entries()) {
              documentTitles.push(docData.title);
              const summary = docData.chunks.join("\n\n").substring(0, 2000);
              summaries.push(`\n\n--- ${docData.title} ---\n${summary}`);
            }
            
            documentContent = summaries.join("\n");
            console.log(`📄 [StudyAgent Chat API] Loaded content from ${docMap.size} documents`);
          }
        }
      } catch (error) {
        console.error("Error fetching document content:", error);
        // Continue without document content
      }
    }

    // ---- Improved System Prompt (TTS Script + Inline Emotion Tags) ----
    const docsInfo =
      selectedDocuments && selectedDocuments.length > 0
        ? documentTitles.length > 0
          ? `${selectedDocuments.length} document(s): ${documentTitles.join(", ")}`
          : `${selectedDocuments.length} document(s) available`
        : "No documents selected yet";

    let systemPrompt = "";

    if (mode === "teacher") {
      if (isIntroduction) {
        systemPrompt = `
You are the student's teacher... warm, patient, and clear.

CONTEXT:
- Field of study: ${fieldOfStudy || "the student's subject"}
- Study materials: ${docsInfo}
${documentContent ? `\n\nDOCUMENT CONTENT:\n${documentContent.substring(0, 3000)}` : ""}

TASK:
Give a first-time welcome message that sounds like the beginning of a lecture... friendly but confident.
- Introduce yourself as their teacher (pick a simple name like “Macy” and keep it consistent).
- Mention the field of study naturally.
- Mention materials are available... without claiming you read them.
- Explain how lessons will work: step-by-step... examples... quick checks.
- Invite the student to start... and ask ONE clear question at the end.

${teacherStyle}
${speechInstruction}

WORD LIMIT:
Under 200 words.
`;
      } else {
        systemPrompt = `
You are the student's teacher... warm, patient, and very clear... like a lecturer at a whiteboard.

CONTEXT:
- Field of study: ${fieldOfStudy || "the student's subject"}
- Study materials: ${docsInfo}
- Research-like question: ${needsResearch ? "YES" : "NO"}
${documentContent ? `\n\nDOCUMENT CONTENT:\n${documentContent.substring(0, 4000)}` : ""}

TASK:
Respond to the student's message with a short lecture-style explanation.
- Define the key idea in simple terms... then build the explanation step-by-step.
- Use a whiteboard metaphor in spoken language (e.g., “On the board...”).
- Include one small example or analogy.
${documentContent ? "- Reference specific content from the study materials when relevant. Cite which document you're referring to." : ""}
- If it is research-like... give a structured mini-overview with 2 to 4 key points.
- Do NOT invent citations or claim you browsed the web.
- End with one quick check-in question.

${teacherStyle}
${speechInstruction}

WORD LIMIT:
Under 300 words.
`;
      }
    } else {
      if (isIntroduction) {
        systemPrompt = `
You are the student's study buddy... friendly, casual, and supportive.

CONTEXT:
- Field of study: ${fieldOfStudy || "the student's subject"}
- Study materials: ${docsInfo}
- Study plan: ${summarizePlan(studyPlan)}
${documentContent ? `\n\nDOCUMENT CONTENT:\n${documentContent.substring(0, 3000)}` : ""}

TASK:
Give a first-time welcome message that feels like a supportive friend starting a study session.
- Introduce yourself as their study buddy (pick a simple name like “Macy” and keep it consistent).
- Mention the field of study naturally.
- Mention materials are available... without claiming you read them.
- Suggest a simple plan for today (2 or 3 small steps).
- Ask ONE friendly question to start.

${buddyStyle}
${speechInstruction}

WORD LIMIT:
Under 100 words.
`;
      } else {
        systemPrompt = `
You are the student's study buddy... friendly, upbeat, and helpful.

CONTEXT:
- Field of study: ${fieldOfStudy || "the student's subject"}
- Study materials: ${docsInfo}
- Study plan: ${summarizePlan(studyPlan)}
- Research-like question: ${needsResearch ? "YES" : "NO"}
${documentContent ? `\n\nDOCUMENT CONTENT:\n${documentContent.substring(0, 4000)}` : ""}

TASK:
Help the student make progress right now.
- Respond casually and clearly.
- Active ask how the student is feeling and what they are working on.
${documentContent ? "- Reference specific content from the study materials when relevant. Cite which document you're referring to." : ""}
- If it is research-like... give a clear overview... then suggest 2 or 3 concrete next steps to study it.

${buddyStyle}
${speechInstruction}

WORD LIMIT:
Under 50 words.
`;
      }
    }

    // Build conversation context
    const messages: (SystemMessage | HumanMessage | AIMessage)[] = [
      new SystemMessage(systemPrompt),
    ];

    // Add conversation history if available (last 5)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      for (const msg of recentHistory) {
        if (msg.role === "user") {
          messages.push(new HumanMessage(msg.content));
        } else {
          // Treat prior assistant outputs as AI messages (not system instructions)
          messages.push(new AIMessage(msg.content));
        }
      }
    }

    // Add current message
    messages.push(new HumanMessage(message));

    // Initialize OpenAI chat
    const chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-5.2", // Fast and cost-effective
      temperature: 0.7,
      timeout: 30000,
    });

    // Generate response
    console.log("🤖 [StudyAgent Chat API] Generating AI response...");
    const response = await chat.invoke(messages);

    // Raw spoken script from model
    const rawScript = (response.content ?? "").toString().trim();

    // Ensure it ends with ellipses for slow TTS
    let scriptForTTS = ensureTrailingEllipses(rawScript);

    // If the model forgot emotion tags, fall back to detection and prefix
    const scriptHasAnyTag = hasAnyEmotionTag(scriptForTTS);
    const scriptStartsWithTag = startsWithEmotionTag(scriptForTTS);

    let emotion: EmotionTag | null = null;

    if (scriptStartsWithTag) {
      // Respect what the model chose
      emotion = extractFirstEmotionTag(scriptForTTS);
    } else {
      // Keep emotion detection (fallback) and always add a leading tag
      const detected = detectEmotion(scriptForTTS) ?? "calm";
      emotion = detected;
      scriptForTTS = `[${detected}] ${scriptForTTS}`;
    }

    // If it contains tags somewhere but not at the start, we still prefer a starting tag for TTS
    if (scriptHasAnyTag && !scriptStartsWithTag && !startsWithEmotionTag(scriptForTTS)) {
      scriptForTTS = `[calm] ${scriptForTTS}`;
      emotion = emotion ?? "calm";
    }

    // Re-ensure ending ellipses after any prefixing
    scriptForTTS = ensureTrailingEllipses(scriptForTTS);

    // Display version without emotion tags (optional but keeps your existing API contract useful)
    const displayScript = stripEmotionTags(scriptForTTS);

    // Log the AI response
    console.log("🤖 [StudyAgent Chat API] AI response generated:");
    console.log("   TTS Script:", scriptForTTS);
    console.log("   Display Script:", displayScript);
    console.log("   Length:", scriptForTTS.length, "characters");
    console.log("   Mode:", mode);
    console.log("   Emotion (metadata):", emotion || "unknown");

    return NextResponse.json(
      {
        response: scriptForTTS, // TTS-friendly script with inline emotion tags + ellipses
        originalResponse: displayScript, // UI-friendly script without tags
        emotion, // metadata (first/leading emotion)
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
