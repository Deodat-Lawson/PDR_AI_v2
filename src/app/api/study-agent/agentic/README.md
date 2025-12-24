# Study Buddy Agentic Agent

An AI-powered study assistant with advanced agentic capabilities built on LangGraph.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Study Buddy Agent Graph                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   START ──► UNDERSTAND ──► PLAN ──► AGENT ──┬──► RESPOND ──► END        │
│                                              │        ▲                  │
│                                              │        │                  │
│                                              └──► TOOLS ─┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Workflow Nodes

### 1. Understand Node
Analyzes user intent and determines the appropriate action:
- Flashcard creation
- Quiz generation
- Concept explanation
- Study plan creation
- Web research
- Document questions
- Progress tracking
- **Task management** (create, complete, list tasks)
- **Pomodoro timer** (start, pause, resume, stop)
- **Note-taking** (create, search, update notes)

### 2. Plan Node
Creates an execution plan based on detected intent:
- Determines which tools to use
- Sets the execution order
- Prepares context for tool calls

### 3. Agent Node
Runs the LLM with tool bindings:
- Uses GPT-4o-mini for fast, intelligent responses
- Bound to all study buddy tools
- Context-aware based on mode

### 4. Tools Node
Executes the selected tools:
- RAG Search
- Flashcard Generation
- Quiz Generation
- Concept Explanation
- Study Plan Creation
- Progress Tracking
- Web Research
- **Task Manager** (create, update, complete, delete, list tasks)
- **Pomodoro Timer** (start, pause, resume, stop, skip, configure)
- **Note Taking** (create, update, delete, search, list, summarize)

### 5. Respond Node
Formats the final response:
- Adds emotion tags for TTS
- Extracts generated content
- Prepares follow-up suggestions

## Available Tools

### 1. RAG Search (`rag_search`)
Search through uploaded documents using ensemble search (BM25 + Vector).

```typescript
{
  query: string;        // The search query
  documentIds: string[]; // Documents to search
  topK?: number;        // Number of results (default: 6)
}
```

### 2. Flashcard Generation (`generate_flashcards`)
Create study flashcards from content.

```typescript
{
  topic: string;                           // Topic for flashcards
  context: string;                         // Source content
  count: number;                           // Number of cards (1-20)
  difficulty?: "easy" | "medium" | "hard" | "mixed";
}
```

### 3. Quiz Generation (`generate_quiz`)
Create quizzes with various question types.

```typescript
{
  topic: string;                                    // Quiz topic
  context: string;                                  // Source content
  questionCount: number;                            // Number of questions (1-15)
  questionTypes?: ("multiple-choice" | "true-false" | "short-answer" | "fill-blank")[];
  difficulty?: "easy" | "medium" | "hard" | "mixed";
}
```

### 4. Concept Explanation (`explain_concept`)
Provide detailed explanations with analogies and examples.

```typescript
{
  concept: string;                                    // Concept to explain
  context?: string;                                   // Additional context
  targetAudience?: "beginner" | "intermediate" | "advanced";
  includeExamples?: boolean;
  includeAnalogy?: boolean;
}
```

### 5. Study Plan Creation (`create_study_plan`)
Create personalized study schedules.

```typescript
{
  goals: string[];           // Learning goals
  availableTime: number;     // Available time in minutes
  topics: string[];          // Topics to cover
  existingPlan?: StudyPlanItem[];
}
```

### 6. Progress Tracking (`track_progress`)
Track study session progress.

```typescript
{
  sessionId?: string;                        // Session ID
  action: "start" | "update" | "complete";   // Action type
  userId: string;                            // User ID
  data?: {
    mode?: StudyMode;
    documentsStudied?: string[];
    conceptsCovered?: string[];
    quizzesTaken?: string[];
    flashcardsReviewed?: number;
    notes?: string[];
  };
}
```

### 7. Web Research (`web_research`)
Search the web for additional information.

```typescript
{
  query: string;                              // Search query
  maxResults?: number;                        // Max results (1-10)
  searchType?: "general" | "academic" | "news";
}
```

### 8. Task Manager (`manage_tasks`)
Create, update, complete, and manage study tasks.

```typescript
{
  action: "create" | "update" | "delete" | "list" | "complete" | "get";
  userId: string;
  taskId?: string;                            // Required for update/delete/complete
  data?: {
    title?: string;
    description?: string;
    priority?: "high" | "medium" | "low";
    dueDate?: string;                         // ISO date string
    estimatedMinutes?: number;
    tags?: string[];
    relatedDocuments?: string[];
  };
  filters?: {                                 // For list action
    status?: "pending" | "in_progress" | "completed" | "cancelled";
    priority?: "high" | "medium" | "low";
  };
}
```

**Examples:**
- "Add a task to review chapter 5"
- "Mark my calculus homework as done"
- "What tasks do I have?"
- "Set my essay to high priority"

### 9. Pomodoro Timer (`pomodoro_timer`)
Control Pomodoro focus sessions for productive studying.

```typescript
{
  action: "start" | "pause" | "resume" | "stop" | "skip" | "status" | "configure";
  userId: string;
  taskId?: string;                            // Optional: associate with a task
  settings?: {                                // For configure action
    workDuration?: number;                    // Minutes (default: 25)
    shortBreakDuration?: number;              // Minutes (default: 5)
    longBreakDuration?: number;               // Minutes (default: 15)
    sessionsBeforeLongBreak?: number;         // (default: 4)
    autoStartBreaks?: boolean;
    autoStartWork?: boolean;
  };
}
```

**Examples:**
- "Start a pomodoro"
- "Pause the timer"
- "How much time left?"
- "Set pomodoro to 30 minutes"
- "Skip this break"

### 10. Note Taking (`take_notes`)
Create, update, search, and manage study notes.

```typescript
{
  action: "create" | "update" | "delete" | "list" | "search" | "get" | "summarize";
  userId: string;
  noteId?: string;                            // Required for update/delete/get/summarize
  data?: {
    title?: string;
    content?: string;
    format?: "text" | "markdown" | "bullet_points";
    tags?: string[];
    relatedDocuments?: string[];
    relatedConcepts?: string[];
    isFavorite?: boolean;
  };
  searchQuery?: string;                       // For search action
  filters?: {                                 // For list action
    tags?: string[];
    isFavorite?: boolean;
    isArchived?: boolean;
  };
}
```

**Examples:**
- "Take a note about photosynthesis"
- "Add to my chemistry notes"
- "Find my notes about the French Revolution"
- "Show me my favorite notes"
- "Summarize my calculus notes"

## Study Modes

### Teacher Mode
- Structured, lecture-style explanations
- Socratic method when appropriate
- Comprehension checks
- Warm but authoritative tone

### Study Buddy Mode
- Friendly and conversational
- Short, encouraging responses
- Emotional support
- Uses tildes (~) for warmth

### Quiz Master Mode
- Interactive quizzing
- Clear feedback on answers
- Engaging and non-stressful
- Progress celebration

### Learning Coach Mode
- Study planning expertise
- Learning strategy guidance
- Progress monitoring
- Meta-learning skills

## API Endpoints

### POST /api/study-agent/agentic
Process a message through the agentic workflow.

**Request Body:**
```json
{
  "message": "Create flashcards for photosynthesis",
  "mode": "study-buddy",
  "fieldOfStudy": "Biology",
  "selectedDocuments": ["doc-123", "doc-456"],
  "studyPlan": [],
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "preferences": {
    "learningStyle": "visual",
    "preferredDifficulty": "intermediate",
    "enableWebSearch": false,
    "responseLength": "moderate"
  }
}
```

**Response:**
```json
{
  "response": "[happy] Here are your flashcards...",
  "displayResponse": "Here are your flashcards...",
  "emotion": "happy",
  "mode": "study-buddy",
  "flashcards": [
    {
      "id": "uuid",
      "front": "Question",
      "back": "Answer",
      "topic": "Photosynthesis",
      "difficulty": "medium",
      "tags": ["biology", "plants"]
    }
  ],
  "toolsUsed": ["rag_search", "generate_flashcards"],
  "retrievedSources": [
    { "documentTitle": "Biology Notes", "page": 12 }
  ],
  "confidence": 0.85,
  "processingTimeMs": 2340,
  "suggestedQuestions": [
    "Quiz me on these flashcards!",
    "Explain the light reactions"
  ],
  "relatedTopics": ["Cellular Respiration", "Chloroplasts"]
}
```

### GET /api/study-agent/agentic
Get agent capabilities and information.

## Usage Examples

### Voice Commands (via Voice Chat)

The agent now supports voice commands! Simply speak naturally and the agent will detect your intent and execute the appropriate tools.

**Task Management:**
- "Add a task to review chapter 5"
- "Create a todo for my calculus homework"
- "What tasks do I have?"
- "Mark my essay as done"
- "I finished the biology reading"

**Pomodoro Timer:**
- "Start a pomodoro"
- "Begin a focus session"
- "Pause the timer"
- "How much time do I have left?"
- "Skip this break"
- "Set the timer to 30 minutes"

**Note-Taking:**
- "Take a note: The mitochondria is the powerhouse of the cell"
- "Write down that photosynthesis requires sunlight"
- "Find my notes about chemistry"
- "Show me my notes"
- "Summarize my biology notes"

**Study Tools:**
- "Create flashcards for chapter 3"
- "Quiz me on the material"
- "Explain derivatives to me"
- "Create a study plan for my exam"

### Basic Chat (API)
```typescript
const response = await fetch('/api/study-agent/agentic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Help me understand derivatives",
    mode: "teacher"
  })
});
```

### Generate Flashcards
```typescript
const response = await fetch('/api/study-agent/agentic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Create 10 flashcards about the French Revolution",
    mode: "study-buddy",
    selectedDocuments: ["history-doc-id"],
    preferences: {
      preferredDifficulty: "intermediate"
    }
  })
});
```

### Take a Quiz
```typescript
const response = await fetch('/api/study-agent/agentic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Quiz me on chapter 5 with 5 multiple choice questions",
    mode: "quiz-master",
    selectedDocuments: ["textbook-chapter-5"]
  })
});
```

## State Management

The agent maintains rich state throughout the workflow:

- **messages**: Conversation history
- **currentStep**: Current workflow step
- **userId**: Authenticated user
- **mode**: Current study mode
- **selectedDocuments**: Documents being studied
- **retrievedContext**: RAG search results
- **generatedFlashcards**: Created flashcards
- **generatedQuizzes**: Created quizzes
- **conceptExplanations**: Explanations provided
- **studyPlan**: User's study plan
- **toolsUsed**: Tools executed this turn
- **emotion**: Current emotional tone

## Error Handling

The agent gracefully handles errors:
- Returns calm, helpful error messages
- Maintains conversation continuity
- Logs errors for debugging
- Never exposes internal details to users

## Performance

- Typical response time: 1-3 seconds for simple queries
- Tool-heavy workflows: 3-10 seconds
- Maximum duration: 120 seconds (configurable)

## Voice Chat Integration

The agentic workflow is fully integrated with the voice chat system:

```
User Speech → STT → Chat API → Agentic Detection → Tool Execution → Response → TTS → Audio
```

### How It Works

1. **Speech Recognition**: User speaks via the VoiceChat component
2. **Transcription**: Audio is sent to STT API (OpenAI Whisper)
3. **Intent Detection**: Chat route checks if message triggers agentic workflow
4. **Tool Execution**: If agentic, runs through LangGraph workflow with tools
5. **Response Generation**: AI generates response with emotion tags
6. **Text-to-Speech**: Response is converted to speech via ElevenLabs
7. **Playback**: Audio plays back to user

### Agentic Triggers

Messages containing these keywords will use the full agentic workflow:

| Category | Keywords |
|----------|----------|
| Tasks | task, todo, to-do, add a, create a task, mark as done, complete the |
| Timer | pomodoro, timer, focus session, start studying, pause, resume, time left |
| Notes | note, write down, remember this, save this, my notes, search notes |
| Study | flashcard, quiz, test me, explain, study plan |

### Example Voice Flow

```
User: "Start a pomodoro and add a task to review chapter 5"

1. STT transcribes speech
2. Chat route detects "pomodoro" and "task" → uses agentic workflow
3. Agent executes:
   - pomodoro_timer (action: "start")
   - manage_tasks (action: "create", title: "Review chapter 5")
4. AI generates response: "[excited] Started a 25-minute Pomodoro! I've also added 'Review chapter 5' to your tasks. Let's focus~ 💪"
5. TTS plays the response with excited emotion
```

## Future Enhancements

- [x] Voice command integration
- [ ] Streaming responses
- [ ] Spaced repetition scheduling
- [ ] Learning analytics
- [ ] Multi-modal support (images, diagrams)
- [ ] Collaborative study sessions

