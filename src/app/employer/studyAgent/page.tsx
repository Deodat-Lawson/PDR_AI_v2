"use client";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./_components/Sidebar";
import { DocumentViewer } from "./_components/DocumentViewer";
import { TeacherPanel } from "./_components/TeacherPanel";
import { StudyBuddyPanel } from "./_components/StudyBuddyPanel";
import { OnboardingScreen } from "./_components/OnboardingScreen";
import { ConnectingScreen } from "./_components/ConnectingScreen";
import { WhiteboardPanel } from "./_components/WhiteboardPanel";
import { CollaborativeDocsEditor } from "./_components/CollaborativeDocsEditor";
import { ResizablePanel } from "./_components/ResizablePanel";
import { Toaster } from "./_components/ui/sonner";

export type Subject = "general" | "math" | "science" | "history" | "literature";

export interface Message {
  id: string;
  role: "user" | "teacher" | "buddy";
  content: string;
  ttsContent?: string; // Text with emotion tags for TTS
  timestamp: Date;
  attachedDocument?: string; // Document name
  attachedDocumentId?: string; // Document ID
  attachedDocumentUrl?: string; // Document URL for PDF display
  isVoice?: boolean;
  isPlaying?: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "image" | "text";
  url: string;
  folder?: string;
  uploadedAt: Date;
}

export interface StudyPlanItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  materials: string[]; // document IDs
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  selectedDocuments: string[];
  name?: string;
  grade: string;
  gender: string;
  fieldOfStudy: string;
  mode: "teacher" | "study-buddy";
  aiGender?: string;
  aiPersonality?: {
    extroversion: number;
    intuition: number;
    thinking: number;
    judging: number;
  };
}

type AppState = "onboarding" | "connecting" | "session";

export default function App() {
  const [appState, setAppState] = useState<AppState>("onboarding");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [teacherView, setTeacherView] = useState<"documents" | "docs" | "whiteboard">("docs");
  const [isDark, setIsDark] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);

  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null);

  // Load persisted study data (goals, notes, preferences) on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const response = await fetch("/api/study-agent/me");
        if (!response.ok) return;

        const data = await response.json();

        if (data.session?.id) {
          setSessionId(Number(data.session.id));
        }

        if (Array.isArray(data.goals)) {
          setStudyPlan(data.goals.map(mapServerGoal));
          console.log(`📝 [StudyAgent] Loaded ${data.goals.length} goals from database`);
        }

        if (Array.isArray(data.notes)) {
          setNotes(
            data.notes.map((note: any, index: number) => ({
              id: note.id?.toString?.() ?? note.id ?? `note-${Date.now()}-${index}`,
              title: note.title ?? "",
              content: note.content ?? "",
              tags: note.tags ?? [],
              createdAt: new Date(note.createdAt),
              updatedAt: new Date(note.updatedAt),
            }))
          );
          console.log(`📒 [StudyAgent] Loaded ${data.notes.length} notes from database`);
        }
      } catch (error) {
        console.error("Error loading persisted study data", error);
      }
    };

    void loadPersistedData();
  }, []);

  // Fetch documents from database on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        setDocumentsError(null);
        
        const response = await fetch("/api/fetchDocument", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "current" }), // userId is obtained from auth on server
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        
        // Transform the response to match Document interface
        interface FetchDocumentResponse {
          id: number;
          title: string;
          url: string;
          category: string;
          createdAt: string | Date;
        }
        const rawDocs = await response.json() as FetchDocumentResponse[];
        const data: Document[] = rawDocs.map((doc) => ({
          id: doc.id.toString(),
          name: doc.title,
          type: "pdf" as const,
          url: doc.url,
          folder: doc.category,
          uploadedAt: new Date(doc.createdAt),
        }));
        
        setDocuments(data);
        console.log(`📚 [StudyAgent] Loaded ${data.length} documents from database`);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setDocumentsError(error instanceof Error ? error.message : "Failed to load documents");
        // Fallback to empty array - user can still proceed
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    };

    void fetchDocuments();
  }, []);

  const mapServerGoal = (goal: any): StudyPlanItem => ({
    id: goal.id?.toString?.() ?? goal.id ?? Date.now().toString(),
    title: goal.title ?? "",
    description: goal.description ?? "",
    completed: Boolean(goal.completed),
    materials: goal.materials ?? [],
  });

  const persistGoalUpdate = async (goalId: string, updates: Partial<StudyPlanItem>) => {
    try {
      const response = await fetch("/api/study-agent/me/study-goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, ...updates, sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      const data = await response.json();
      if (data.goal) {
        setStudyPlan((prev) =>
          prev.map((item) => (item.id === goalId ? mapServerGoal(data.goal) : item))
        );
      }
      setStudyPlanError(null);
    } catch (error) {
      console.error("Error saving study goal", error);
      setStudyPlanError("We couldn't save your study goals. Changes are local only.");
    }
  };

  const persistGoalCreate = async (item: StudyPlanItem) => {
    try {
      const response = await fetch("/api/study-agent/me/study-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          materials: item.materials,
          completed: item.completed,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create goal");
      }

      const data = await response.json();
      if (data.goal) {
        setStudyPlan((prev) =>
          prev.map((goal) => (goal.id === item.id ? mapServerGoal(data.goal) : goal))
        );
      }
      setStudyPlanError(null);
    } catch (error) {
      console.error("Error creating study goal", error);
      setStudyPlanError("We couldn't save your study goals. Changes are local only.");
    }
  };

  const persistGoalDelete = async (goalId: string) => {
    try {
      const response = await fetch("/api/study-agent/me/study-goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goalId, sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }
      setStudyPlanError(null);
    } catch (error) {
      console.error("Error deleting study goal", error);
      setStudyPlanError("We couldn't sync the removal with the server. Try again later.");
    }
  };

  const handleCompleteOnboarding = async (preferences: UserPreferences) => {
    setPreferencesError(null);
    setStudyPlanError(null);
    setUserPreferences(preferences);

    let newSessionId: number | null = null;

    try {
      const sessionResponse = await fetch("/api/study-agent/me/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: preferences.name ? `${preferences.name}'s Session` : undefined }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to start a study session");
      }

      const sessionData = await sessionResponse.json();
      if (sessionData.session?.id) {
        newSessionId = Number(sessionData.session.id);
        setSessionId(newSessionId);
      }
    } catch (error) {
      console.error("Error creating study session", error);
      setPreferencesError("We couldn't start your study session. Please try again.");
      return;
    }
    
    // Set selected document
    if (preferences.selectedDocuments.length > 0) {
      const firstDoc = documents.find(d => d.id === preferences.selectedDocuments[0]);
      if (firstDoc) setSelectedDocument(firstDoc);
    }

    // Generate initial study plan based on selected documents
    const initialPlan: StudyPlanItem[] = preferences.selectedDocuments.map((docId, index) => {
      const doc = documents.find(d => d.id === docId);
      return {
        id: `plan-${index}`,
        title: doc ? `Study ${doc.name}` : `Topic ${index + 1}`,
        description: doc ? `Review and understand key concepts from ${doc.name}` : "Complete this learning objective",
        completed: false,
        materials: [docId],
      };
    });
    setStudyPlan(initialPlan);

    let planForSession: StudyPlanItem[] = initialPlan;
    try {
      const profileResponse = await fetch("/api/study-agent/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preferences.name,
          grade: preferences.grade,
          gender: preferences.gender,
          fieldOfStudy: preferences.fieldOfStudy,
          sessionId: newSessionId ?? sessionId,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to save profile");
      }

      const prefResponse = await fetch("/api/study-agent/me/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, sessionId: newSessionId ?? sessionId }),
      });

      if (!prefResponse.ok) {
        throw new Error("Failed to save preferences");
      }

      const goalsResponse = await fetch("/api/study-agent/me/study-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: initialPlan, sessionId: newSessionId ?? sessionId }),
      });

      if (!goalsResponse.ok) {
        throw new Error("Failed to save study plan");
      }

      const goalData = await goalsResponse.json() as { goals?: StudyPlanItem[] };
      if (Array.isArray(goalData.goals)) {
        planForSession = goalData.goals.map(mapServerGoal);
        setStudyPlan(planForSession);
      }
    } catch (error) {
      console.error("Error saving onboarding data", error);
      setPreferencesError("We couldn't save your study setup. We'll keep it local for now.");
    }

    setAppState("connecting");

    interface ChatResponse {
      originalResponse?: string;
      response?: string;
      emotion?: string;
      mode?: string;
    }

    try {
      const response = await fetch("/api/study-agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Please introduce yourself and discuss the study materials. Also mention that I can create a study plan.",
          mode: preferences.mode ?? "teacher",
          fieldOfStudy: preferences.fieldOfStudy,
          selectedDocuments: preferences.selectedDocuments ?? [],
          studyPlan: planForSession,
          conversationHistory: [],
        }),
      });

      if (response.ok) {
        const data = await response.json() as ChatResponse;
        const originalResponse = data.originalResponse ?? data.response ?? "Hello! I'm your AI study companion. Let's begin!";
        const ttsResponse = data.response ?? originalResponse; // Includes emotion tags
        
        const introductionMessage: Message = {
          id: "1",
          role: preferences.mode === "teacher" ? "teacher" : "buddy",
          content: originalResponse, // Display without emotion tags
          ttsContent: ttsResponse, // TTS version with emotion tags
          timestamp: new Date(),
          isVoice: true,
        };
        setMessages([introductionMessage]);
      } else {
        // Fallback introduction with happy/excited emotion
        const fallbackContent = preferences.mode === "teacher" 
          ? `Hello! I'm your AI teacher. I've reviewed your materials on ${preferences.fieldOfStudy}. Let's start by going through the key concepts together. I'll use the whiteboard to explain things visually.`
          : `Hey! I'm your AI study buddy! I see you're studying ${preferences.fieldOfStudy}. I've created a study plan based on your materials. Let's work through this together!`;
        
        const welcomeMessage: Message = {
          id: "1",
          role: preferences.mode === "teacher" ? "teacher" : "buddy",
          content: fallbackContent,
          ttsContent: `[happy] ${fallbackContent}`, // Add happy emotion for introduction
          timestamp: new Date(),
          isVoice: true,
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Error generating introduction:", error);
      // Fallback introduction with happy emotion
      const fallbackContent = preferences.mode === "teacher" 
        ? `Hello! I'm your AI teacher. I've reviewed your materials on ${preferences.fieldOfStudy}. Let's start by going through the key concepts together.`
        : `Hey! I'm your AI study buddy! I see you're studying ${preferences.fieldOfStudy}. Let's work through this together!`;
      
      const welcomeMessage: Message = {
        id: "1",
        role: preferences.mode === "teacher" ? "teacher" : "buddy",
        content: fallbackContent,
        ttsContent: `[happy] ${fallbackContent}`, // Add happy emotion for introduction
        timestamp: new Date(),
        isVoice: true,
      };
      setMessages([welcomeMessage]);
    }

    // Move to session after connection animation
    setTimeout(() => {
      setAppState("session");
    }, 3000);
  };

  // Handle ending the call - go back to onboarding but keep messages for resume
  const handleEndCall = () => {
    console.log("📞 [StudyAgent] Call ended, returning to onboarding");
    // Go back to onboarding - messages are kept in state for potential resume
    setAppState("onboarding");
    // Reset user preferences to allow new session setup
    setUserPreferences(null);
    setSessionId(null);
  };

  const handleSendMessage = async (content: string) => {
    // Extended response interface for agentic workflow
    interface ChatResponse {
      originalResponse?: string;
      response?: string;
      emotion?: string;
      mode?: string;
      // Agentic response fields
      isAgenticResponse?: boolean;
      flashcards?: Array<{
        id: string;
        front: string;
        back: string;
        topic: string;
        difficulty: string;
        tags: string[];
      }>;
      quiz?: {
        id: string;
        title: string;
        questions: Array<{
          id: string;
          question: string;
          type: string;
          options?: string[];
          correctAnswer: string;
          explanation: string;
        }>;
      };
      updatedStudyPlan?: Array<{
        id: string;
        title: string;
        description: string;
        completed: boolean;
        priority: string;
      }>;
      toolsUsed?: string[];
      suggestedQuestions?: string[];
    }

    // Log the user message being sent
    console.log("💬 [StudyAgent] User message received:");
    console.log("   Content:", content);
    console.log("   Length:", content.length, "characters");
    console.log("   Mode:", userPreferences?.mode ?? "teacher");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      isVoice: true,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Get current messages for conversation history
    const currentMessages = [...messages, userMessage];

    try {
      // Call the study agent chat API
      console.log("🤖 [StudyAgent] Calling chat API...");
      const response = await fetch("/api/study-agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          mode: userPreferences?.mode ?? "teacher",
          fieldOfStudy: userPreferences?.fieldOfStudy,
          selectedDocuments: userPreferences?.selectedDocuments ?? [],
          studyPlan: studyPlan,
          conversationHistory: currentMessages.slice(-5).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json() as ChatResponse;
      // Use originalResponse for display (without emotion tags), responseWithEmotion for TTS
      const aiResponse = data.originalResponse ?? data.response ?? "I'm sorry, I couldn't generate a response right now.";
      const ttsResponse = data.response ?? aiResponse; // Includes emotion tags for TTS

      // Log the AI response
      console.log("🤖 [StudyAgent] AI response received:");
      console.log("   Response (display):", aiResponse);
      console.log("   Response (TTS with emotion):", ttsResponse);
      console.log("   Emotion:", data.emotion ?? "neutral");
      console.log("   Length:", aiResponse.length, "characters");
      console.log("   Mode:", data.mode ?? userPreferences?.mode);
      
      // Handle agentic response extras
      if (data.isAgenticResponse) {
        console.log("🤖 [StudyAgent] Agentic response detected!");
        console.log("   Tools used:", data.toolsUsed?.join(", ") ?? "none");
        
        // Handle updated study plan from agent
        if (data.updatedStudyPlan && data.updatedStudyPlan.length > 0) {
          console.log("📋 [StudyAgent] Updating study plan with", data.updatedStudyPlan.length, "items");
          const newItems: StudyPlanItem[] = data.updatedStudyPlan.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            completed: item.completed,
            materials: [],
          }));
          setStudyPlan((prev) => {
            // Merge with existing items
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          });
        }
        
        // Handle flashcards - could add to a flashcard state in the future
        if (data.flashcards && data.flashcards.length > 0) {
          console.log("🃏 [StudyAgent] Generated", data.flashcards.length, "flashcards");
          // Flashcards are included in the response for display/voice
        }
        
        // Handle quiz - could add to a quiz state in the future
        if (data.quiz) {
          console.log("📝 [StudyAgent] Generated quiz:", data.quiz.title);
          // Quiz is included in the response for display/voice
        }
        
        // Log suggested follow-up questions
        if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
          console.log("💡 [StudyAgent] Suggested questions:", data.suggestedQuestions);
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: userPreferences?.mode === "teacher" ? "teacher" : "buddy",
        content: aiResponse, // Display without emotion tags
        ttsContent: ttsResponse, // TTS version with emotion tags
        timestamp: new Date(),
        isVoice: true,
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error getting AI response:", error);
      // Fallback to mock response if API fails
      const aiResponse = generateResponse(content, userPreferences?.mode ?? "teacher", selectedDocument, studyPlan);
      
      // Add emotion tag for fallback response (usually encouraging/calm)
      const ttsResponse = `[calm] ${aiResponse}`;
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: userPreferences?.mode === "teacher" ? "teacher" : "buddy",
        content: aiResponse,
        ttsContent: ttsResponse, // Include emotion tag for TTS
        timestamp: new Date(),
        isVoice: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }
  };

  const handleUploadDocument = (file: File) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type.includes("pdf") ? "pdf" : file.type.includes("image") ? "image" : "text",
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
    };
    setDocuments((prev) => [...prev, newDoc]);
  };

  const handlePullUpMaterial = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setSelectedDocument(doc);
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: userPreferences?.mode === "teacher" ? "teacher" : "buddy",
        content: `Let me pull up "${doc.name}" for us to review together. What specific part would you like to focus on?`,
        timestamp: new Date(),
        attachedDocument: doc.name,
        attachedDocumentId: doc.id,
        attachedDocumentUrl: doc.url,
        isVoice: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }
  };

  const handleToggleStudyItem = (itemId: string) => {
    setStudyPlan((prev) => {
      const target = prev.find((item) => item.id === itemId);
      const nextCompleted = target ? !target.completed : false;
      void persistGoalUpdate(itemId, { completed: nextCompleted });
      return prev.map((item) =>
        item.id === itemId ? { ...item, completed: nextCompleted } : item
      );
    });
  };

  const handleAddStudyItem = async (item: Omit<StudyPlanItem, "id">) => {
    // Optimistically add locally
    const tempId = Date.now().toString();
    const newItem: StudyPlanItem = {
      ...item,
      id: tempId,
    };
    setStudyPlan((prev) => [...prev, newItem]);
    void persistGoalCreate(newItem);
  };

  const handleEditStudyItem = (itemId: string, updates: Partial<StudyPlanItem>) => {
    setStudyPlan((prev) => {
      void persistGoalUpdate(itemId, updates);
      return prev.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
    });
  };

  const handleDeleteStudyItem = (itemId: string) => {
    setStudyPlan((prev) => prev.filter((item) => item.id !== itemId));
    void persistGoalDelete(itemId);
  };

  const handleAddNote = (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(), // fix this
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>) => {
    // Optimistically update locally
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, ...updates, updatedAt: new Date() } : note
      )
    );

    // Sync with backend
    try {
      await fetch("/api/study-agent/sync/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          noteId,
          data: updates,
          sessionId,
        }),
      });
    } catch (error) {
      console.error("Error syncing note update to backend:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    // Optimistically remove locally
    setNotes((prev) => prev.filter((note) => note.id !== noteId));

    // Sync with backend
    try {
      await fetch("/api/study-agent/sync/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          noteId,
          sessionId,
        }),
      });
    } catch (error) {
      console.error("Error syncing note deletion to backend:", error);
    }
  };

  // Render appropriate screen based on state
  if (appState === "onboarding") {
    if (documentsLoading) {
      return (
        <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading documents...</p>
          </div>
        </div>
      );
    }
    
    if (documentsError) {
      return (
        <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">Error loading documents: {documentsError}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>You can still proceed, but documents may not be available.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <OnboardingScreen
        documents={documents}
        onComplete={handleCompleteOnboarding}
        onUploadDocument={handleUploadDocument}
        errorMessage={preferencesError}
      />
    );
  }

  if (appState === "connecting") {
    return (
      <ConnectingScreen 
        mode={userPreferences?.mode ?? "teacher"}
        fieldOfStudy={userPreferences?.fieldOfStudy ?? ""}
      />
    );
  }

  // Session state - show main interface
  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left Sidebar - Document Library (Hidden by default, toggleable) */}
      {showSidebar && (
        <ResizablePanel
          defaultWidth={280}
          minWidth={200}
          maxWidth={400}
          position="left"
        >
          <Sidebar
            documents={documents}
            selectedDocument={selectedDocument}
            onSelectDocument={setSelectedDocument}
            onUploadDocument={handleUploadDocument}
            isDark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
            onCloseSidebar={() => setShowSidebar(false)}
          />
        </ResizablePanel>
      )}

      {/* Center - Document Viewer, Whiteboard, or Docs Editor */}
      <div className="flex-1 min-w-0">
        {userPreferences?.mode === "teacher" ? (
          teacherView === "documents" ? (
            <DocumentViewer document={selectedDocument} isDark={isDark} />
          ) : teacherView === "docs" ? (
            <CollaborativeDocsEditor document={selectedDocument} isDark={isDark} />
          ) : (
            <WhiteboardPanel document={selectedDocument} isDark={isDark} />
          )
        ) : (
          <DocumentViewer document={selectedDocument} isDark={isDark} />
        )}
      </div>

      {/* Right Sidebar - AI Panel based on mode (Resizable) */}
      <ResizablePanel
        defaultWidth={384}
        minWidth={320}
        maxWidth={600}
        position="right"
      >
        {userPreferences?.mode === "teacher" ? (
          <TeacherPanel
            messages={messages}
            studyPlan={studyPlan}
            documents={documents}
            onSendMessage={handleSendMessage}
            onEndCall={handleEndCall}
            onPullUpMaterial={handlePullUpMaterial}
            onToggleStudyItem={handleToggleStudyItem}
            onToggleView={setTeacherView}
            currentView={teacherView}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            isDark={isDark}
          />
        ) : (
          <StudyBuddyPanel
            messages={messages}
            studyPlan={studyPlan}
            documents={documents}
            notes={notes}
            selectedDocument={selectedDocument}
            onSendMessage={handleSendMessage}
            onEndCall={handleEndCall}
            onPullUpMaterial={handlePullUpMaterial}
            onToggleStudyItem={handleToggleStudyItem}
            onAddStudyItem={handleAddStudyItem}
            onEditStudyItem={handleEditStudyItem}
            onDeleteStudyItem={handleDeleteStudyItem}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            isDark={isDark}
            errorMessage={studyPlanError}
          />
        )}
      </ResizablePanel>
      
      <Toaster />
    </div>
  );
}

function generateResponse(
  question: string,
  mode: "teacher" | "study-buddy",
  currentDoc: Document | null,
  studyPlan: StudyPlanItem[]
): string {
  const lowerQuestion = question.toLowerCase();

  if (mode === "teacher") {
    if (lowerQuestion.includes("explain") || lowerQuestion.includes("what is")) {
      return `Great question! Let me explain this on the whiteboard. ${
        currentDoc ? `Looking at "${currentDoc.name}", ` : ""
      }I'll break down the key concepts step by step and draw some diagrams to make it clearer.`;
    }
    if (lowerQuestion.includes("example")) {
      return `Absolutely! Let me show you an example. I'll write it out on the whiteboard so we can work through it together. Pay attention to each step.`;
    }
    return `That's an important question. Let me illustrate this concept on the whiteboard. ${
      currentDoc ? `Based on the material in "${currentDoc.name}", ` : ""
    }I'll guide you through the main ideas with visual examples.`;
  } else {
    if (lowerQuestion.includes("study plan")) {
      const nextItem = studyPlan.find(item => !item.completed);
      if (nextItem) {
        return `Let's look at our study plan! I think we should tackle "${nextItem.title}" next. Want me to help you add more details or break it down into smaller tasks?`;
      }
      return `Awesome! You've completed everything on your study plan. Let's create some new goals together!`;
    }
    if (lowerQuestion.includes("help")) {
      return `Of course! I'm here to help. ${
        currentDoc ? `Let's review "${currentDoc.name}" together. ` : ""
      }We can work through any confusing parts at your own pace. What section should we focus on?`;
    }
    return `Good thinking! ${
      currentDoc ? `Looking at "${currentDoc.name}", ` : ""
    }Let's work through this together. We can update our study plan as we go to track what we've covered!`;
  }
}
