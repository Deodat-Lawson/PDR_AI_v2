"use client";

import React, { useState } from "react";
import { Brain, Clock, FileSearch, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import styles from "~/styles/Employer/DocumentViewer.module.css";
import { ChatSelector } from "../ChatSelector";
import { AgentChatInterface } from "../AgentChatInterface";
import type { DocumentType, AiPersona } from "./types";

interface AiChatLayoutProps {
  selectedDoc: DocumentType | null;
  pdfPageNumber: number;
  setPdfPageNumber: React.Dispatch<React.SetStateAction<number>>;
  userId: string | null;
  currentChatId: string | null;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  searchScope: "document" | "company";
  setSearchScope: React.Dispatch<React.SetStateAction<"document" | "company">>;
  companyId: number | null;
  aiStyle: string;
  setAiStyle: React.Dispatch<React.SetStateAction<string>>;
  styleOptions: Record<string, string>;
  aiPersona: AiPersona;
  setAiPersona: React.Dispatch<React.SetStateAction<AiPersona>>;
  updateChat: (chatId: string, updates: { aiStyle?: string; aiPersona?: string }) => Promise<void>;
  createChat: (options: {
    userId: string;
    title: string;
    agentMode: string;
    visibility: string;
    aiStyle: string;
    aiPersona: string;
  }) => Promise<{ id: string } | null>;
  leftSidebarWidth: number;
  setLeftSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  isLeftSidebarCollapsed: boolean;
  setIsLeftSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingLeft: boolean;
  setIsDraggingLeft: React.Dispatch<React.SetStateAction<boolean>>;
  leftDragStartX: number;
  setLeftDragStartX: React.Dispatch<React.SetStateAction<number>>;
  leftDragStartWidth: number;
  setLeftDragStartWidth: React.Dispatch<React.SetStateAction<number>>;
  rightSidebarWidth: number;
  isRightSidebarCollapsed: boolean;
  setIsRightSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingRight: boolean;
  setIsDraggingRight: React.Dispatch<React.SetStateAction<boolean>>;
  setRightDragStartX: React.Dispatch<React.SetStateAction<number>>;
  setRightDragStartWidth: React.Dispatch<React.SetStateAction<number>>;
}

const getPdfSrcWithPage = (url: string, page: number) => `${url}#page=${page}`;

export const AiChatLayout: React.FC<AiChatLayoutProps> = ({
  selectedDoc,
  pdfPageNumber,
  setPdfPageNumber,
  userId,
  currentChatId,
  setCurrentChatId,
  searchScope,
  setSearchScope,
  companyId,
  aiStyle,
  setAiStyle,
  styleOptions,
  aiPersona,
  setAiPersona,
  updateChat,
  createChat,
  leftSidebarWidth,
  isLeftSidebarCollapsed,
  setIsLeftSidebarCollapsed,
  isDraggingLeft,
  setIsDraggingLeft,
  setLeftDragStartX,
  setLeftDragStartWidth,
  rightSidebarWidth,
  isRightSidebarCollapsed,
  setIsRightSidebarCollapsed,
  isDraggingRight,
  setIsDraggingRight,
  setRightDragStartX,
  setRightDragStartWidth,
}) => {
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);
  const [pendingChatTitle, setPendingChatTitle] = useState('');

  return (
    <div className={clsx(styles.splitLayoutContainer, "gap-0")}>
      {/* Left Chat History Sidebar */}
      {!isLeftSidebarCollapsed && (
        <>
          <div
            className={clsx(
              styles.sidebar,
              "sticky top-0",
              isDraggingLeft && styles.dragging
            )}
            style={{ width: `${leftSidebarWidth}px`, maxHeight: "100vh" }}
          >
            {/* Header with collapse button */}
            <div className={styles.sidebarHeader}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Clock className="w-9 h-9 flex-shrink-0 text-purple-600 dark:text-purple-400 p-1.5 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/20 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">Chat History</h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeftSidebarCollapsed(true)}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Chat History Content - Agent Chatbot Chats */}
            <div className="flex-1 overflow-y-auto p-4">
              {userId && (
                <ChatSelector
                  userId={userId}
                  currentChatId={currentChatId}
                  onSelectChat={setCurrentChatId}
                  onNewChat={async () => {
                    if (!userId) return;
                    const title = selectedDoc 
                      ? `Chat about ${selectedDoc.title}` 
                      : 'General AI Chat';
                    setPendingChatTitle(title);
                    setShowExpertiseModal(true);
                  }}
                />
              )}
            </div>
          </div>

          {/* Resize Handle for Left Sidebar */}
          <div
            className={clsx(
              styles.resizeHandle,
              "flex-shrink-0",
              isDraggingLeft && styles.dragging
            )}
            onMouseDown={(e) => {
              setLeftDragStartX(e.clientX);
              setLeftDragStartWidth(leftSidebarWidth);
              setIsDraggingLeft(true);
            }}
          />
        </>
      )}

      {/* Reopen Button for Left Sidebar */}
      {isLeftSidebarCollapsed && (
        <button
          onClick={() => setIsLeftSidebarCollapsed(false)}
          className={clsx(
            styles.reopenButton,
            "left-4 top-1/2 -translate-y-1/2 rounded-r-lg flex-col"
          )}
          title="Open Chat History"
        >
          <Clock className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">History</span>
        </button>
      )}

      {/* Main Chat Content - Agent Chatbot Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-purple-500/30 flex flex-col min-h-0 overflow-hidden">
          {/* Settings Bar - Sticky but with proper spacing */}
          <div className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-600 flex-shrink-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm mb-0">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Context Scope</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="document"
                      checked={searchScope === "document"}
                      onChange={(e) => setSearchScope(e.target.value as "document" | "company")}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      Current Document
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="company"
                      checked={searchScope === "company"}
                      onChange={(e) => setSearchScope(e.target.value as "document" | "company")}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                      disabled={!companyId}
                    />
                    <span className={clsx(
                      "text-sm transition-colors",
                      !companyId ? "text-gray-400 cursor-not-allowed" : "text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    )}>
                      All Company Docs
                    </span>
                  </label>
                </div>
              </div>
              <div className="w-48">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Style</label>
                <select
                  value={aiStyle}
                  onChange={async (e) => {
                    const newStyle = e.target.value as 'concise' | 'detailed' | 'academic' | 'bullet-points';
                    setAiStyle(newStyle);
                    if (currentChatId) {
                      await updateChat(currentChatId, { aiStyle: newStyle });
                    }
                  }}
                  className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  {Object.entries(styleOptions).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-60">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Expertise</label>
                <select
                  value={aiPersona}
                  onChange={async (e) => {
                    const newPersona = e.target.value as AiPersona;
                    setAiPersona(newPersona);
                    if (currentChatId) {
                      await updateChat(currentChatId, { aiPersona: newPersona });
                    }
                  }}
                  className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 w-full focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="general">General</option>
                  <option value="learning-coach">Learning Coach</option>
                  <option value="financial-expert">Financial Expert</option>
                  <option value="legal-expert">Legal Expert</option>
                  <option value="math-reasoning">Math Reasoning</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chat Configuration Modal */}
          {showExpertiseModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configure Your Chat</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Customize how the AI responds to your questions by selecting expertise and style preferences.
                </p>
                
                {/* Expertise Selection */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Expertise</label>
                  <div className="space-y-2">
                    {(['general', 'learning-coach', 'financial-expert', 'legal-expert', 'math-reasoning'] as AiPersona[]).map((persona) => (
                      <label
                        key={persona}
                        className={clsx(
                          "flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all",
                          aiPersona === persona
                            ? "border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                            : "border-transparent dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        )}
                      >
                        <input
                          type="radio"
                          value={persona}
                          checked={aiPersona === persona}
                          onChange={(e) => setAiPersona(e.target.value as AiPersona)}
                          className="mr-3 text-purple-600 dark:text-purple-400 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {persona.replace('-', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {persona === 'general' && 'General purpose assistance'}
                            {persona === 'learning-coach' && 'Helps you learn and understand concepts'}
                            {persona === 'financial-expert' && 'Specialized in financial analysis'}
                            {persona === 'legal-expert' && 'Expert in legal matters and compliance'}
                            {persona === 'math-reasoning' && 'Advanced mathematical problem solving'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Response Style</label>
                  <select
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value)}
                    className="w-full border-2 border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  >
                    {Object.entries(styleOptions).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!userId) return;
                      const chat = await createChat({
                        userId,
                        title: pendingChatTitle,
                        agentMode: 'interactive',
                        visibility: 'private',
                        aiStyle: aiStyle,
                        aiPersona: aiPersona,
                      });
                      if (chat) {
                        setCurrentChatId(chat.id);
                      }
                      setShowExpertiseModal(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-medium"
                  >
                    Start Chat
                  </button>
                  <button
                    onClick={() => setShowExpertiseModal(false)}
                    className="px-4 py-2.5 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Agent Chatbot Interface */}
          {userId && currentChatId ? (
            <AgentChatInterface
              chatId={currentChatId}
              userId={userId}
              selectedDocTitle={selectedDoc?.title}
              searchScope={searchScope}
              selectedDocId={selectedDoc?.id}
              companyId={companyId}
              aiStyle={aiStyle}
              aiPersona={aiPersona}
              onPageClick={setPdfPageNumber}
              onAIResponse={(_response) => {
                // Handle AI response if needed
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 text-purple-300 dark:text-purple-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">Select or create a chat to get started</p>
                {userId && (
                  <button
                    onClick={() => {
                      const title = selectedDoc 
                        ? `Chat about ${selectedDoc.title}` 
                        : 'General AI Chat';
                      setPendingChatTitle(title);
                      setShowExpertiseModal(true);
                    }}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
                  >
                    Create New Chat
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Document Navbar */}
      {!isRightSidebarCollapsed && (
        <>
          {/* Resize Handle */}
          <div
            className={clsx(
              styles.resizeHandle,
              "flex-shrink-0",
              isDraggingRight && styles.dragging
            )}
            onMouseDown={(e) => {
              setRightDragStartX(e.clientX);
              setRightDragStartWidth(rightSidebarWidth);
              setIsDraggingRight(true);
            }}
          />

          <div
            className={clsx(
              styles.sidebar,
              styles.sidebarRight,
              styles.draggableSidebar,
              "sticky top-0",
              isDraggingRight && styles.dragging
            )}
            style={{ width: `${rightSidebarWidth}px`, maxHeight: "100vh" }}
          >
            {/* Header with collapse button */}
            <div className={styles.sidebarHeader}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileSearch className="w-9 h-9 flex-shrink-0 text-purple-600 dark:text-purple-400 p-1.5 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/20 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">Preview Document</h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsRightSidebarCollapsed(true)}
                  className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                  aria-label="Collapse sidebar"
                >
                  <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className={clsx(styles.sidebarBody, "space-y-4")}>
              {selectedDoc ? (
                <>
                  {/* PDF Viewer */}
                  <div className="rounded-2xl border-2 border-gray-200 dark:border-purple-500/30 overflow-hidden shadow-xl bg-white dark:bg-slate-800">
                    <div className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/20 px-4 py-2 border-b border-gray-200 dark:border-purple-500/30">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Page {pdfPageNumber}
                      </p>
                    </div>
                    <iframe
                      key={pdfPageNumber}
                      src={getPdfSrcWithPage(selectedDoc.url, pdfPageNumber)}
                      className="w-full h-[calc(100vh-20rem)] border-0"
                      title={selectedDoc.title}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/20 border-2 border-dashed border-gray-300 dark:border-purple-500/30 rounded-2xl text-center p-6">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No Document Selected</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Choose a document from the main library to preview it while chatting
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reopen Button */}
      {isRightSidebarCollapsed && (
        <button
          onClick={() => setIsRightSidebarCollapsed(false)}
          className={clsx(
            styles.reopenButton,
            "right-4 top-1/2 -translate-y-1/2 rounded-l-lg flex-col"
          )}
          title="Open Document Viewer"
        >
          <FileSearch className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Docs</span>
        </button>
      )}
    </div>
  );
};

