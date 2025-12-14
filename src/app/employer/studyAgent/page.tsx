"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "./_components/Sidebar";
import { DocumentViewer } from "./_components/DocumentViewer";
import { TeacherPanel } from "./_components/TeacherPanel";
import { StudyBuddyPanel } from "./_components/StudyBuddyPanel";
import { OnboardingScreen } from "./_components/OnboardingScreen";
import { ConnectingScreen } from "./_components/ConnectingScreen";
import { WhiteboardPanel } from "./_components/WhiteboardPanel";

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

export interface UserPreferences {
  selectedDocuments: string[];
  grade: string;
  gender: string;
  fieldOfStudy: string;
  mode: "teacher" | "study-buddy";
}

type AppState = "onboarding" | "connecting" | "session";

export default function App() {
  const [appState, setAppState] = useState<AppState>("onboarding");
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);

  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);

  // Fetch documents from database on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        setDocumentsError(null);
        
        const response = await fetch("/api/study-agent/documents");
        
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        
        const data = await response.json() as Document[];
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

  const handleCompleteOnboarding = async (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    
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

    setAppState("connecting");

    interface ChatResponse {
      originalResponse?: string;
      response?: string;
      emotion?: string;
      mode?: string;
    }

    // Generate introduction via API
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
          studyPlan: initialPlan,
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
  };

  const handleSendMessage = async (content: string) => {
    interface ChatResponse {
      originalResponse?: string;
      response?: string;
      emotion?: string;
      mode?: string;
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
    setStudyPlan((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleAddStudyItem = (item: Omit<StudyPlanItem, "id">) => {
    const newItem: StudyPlanItem = {
      ...item,
      id: Date.now().toString(),
    };
    setStudyPlan((prev) => [...prev, newItem]);
  };

  const handleEditStudyItem = (itemId: string, updates: Partial<StudyPlanItem>) => {
    setStudyPlan((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleDeleteStudyItem = (itemId: string) => {
    setStudyPlan((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Render appropriate screen based on state
  if (appState === "onboarding") {
    if (documentsLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading documents...</p>
          </div>
        </div>
      );
    }
    
    if (documentsError) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">Error loading documents: {documentsError}</p>
            <p className="text-gray-600 text-sm">You can still proceed, but documents may not be available.</p>
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
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Document Library */}
      <Sidebar
        documents={documents}
        selectedDocument={selectedDocument}
        onSelectDocument={setSelectedDocument}
        onUploadDocument={handleUploadDocument}
      />

      {/* Center - Document Viewer or Whiteboard */}
      {userPreferences?.mode === "teacher" ? (
        <WhiteboardPanel document={selectedDocument} />
      ) : (
        <DocumentViewer document={selectedDocument} />
      )}

      {/* Right Sidebar - AI Panel based on mode */}
      {userPreferences?.mode === "teacher" ? (
        <TeacherPanel
          messages={messages}
          studyPlan={studyPlan}
          documents={documents}
          onSendMessage={handleSendMessage}
          onEndCall={handleEndCall}
          onPullUpMaterial={handlePullUpMaterial}
          onToggleStudyItem={handleToggleStudyItem}
        />
      ) : (
        <StudyBuddyPanel
          messages={messages}
          studyPlan={studyPlan}
          documents={documents}
          selectedDocument={selectedDocument}
          onSendMessage={handleSendMessage}
          onEndCall={handleEndCall}
          onPullUpMaterial={handlePullUpMaterial}
          onToggleStudyItem={handleToggleStudyItem}
          onAddStudyItem={handleAddStudyItem}
          onEditStudyItem={handleEditStudyItem}
          onDeleteStudyItem={handleDeleteStudyItem}
        />
      )}
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
