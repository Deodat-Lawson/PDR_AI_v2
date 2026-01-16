"use client";

import React from "react";
import { Brain } from "lucide-react";
import clsx from "clsx";
import styles from "~/styles/Employer/DocumentViewer.module.css";
import MarkdownMessage from "~/app/_components/MarkdownMessage";
import type { DocumentType } from "../../types";

interface SimpleQueryLayoutProps {
  selectedDoc: DocumentType | null;
  pdfPageNumber: number;
  rightSidebarWidth: number;
  isRightSidebarCollapsed: boolean;
  isDraggingRight: boolean;
  setRightDragStartX: (x: number) => void;
  setRightDragStartWidth: (width: number) => void;
  setIsDraggingRight: (dragging: boolean) => void;
  setIsRightSidebarCollapsed: (collapsed: boolean) => void;
  searchScope: "document" | "company";
  setSearchScope: React.Dispatch<React.SetStateAction<"document" | "company">>;
  companyId: number | null;
  aiStyle: string;
  setAiStyle: React.Dispatch<React.SetStateAction<string>>;
  styleOptions: Record<string, string>;
  aiQuestion: string;
  setAiQuestion: React.Dispatch<React.SetStateAction<string>>;
  aiLoading: boolean;
  handleAiSearch: (e: React.FormEvent) => void;
  aiError: string;
  aiAnswer: string;
  referencePages: number[];
  setPdfPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

const getPdfSrcWithPage = (url: string, page: number) => `${url}#page=${page}`;

export const SimpleQueryLayout: React.FC<SimpleQueryLayoutProps> = ({
  selectedDoc,
  pdfPageNumber,
  rightSidebarWidth,
  isRightSidebarCollapsed,
  isDraggingRight,
  setRightDragStartX,
  setRightDragStartWidth,
  setIsDraggingRight,
  setIsRightSidebarCollapsed,
  searchScope,
  setSearchScope,
  companyId,
  aiStyle,
  setAiStyle,
  styleOptions,
  aiQuestion,
  setAiQuestion,
  aiLoading,
  handleAiSearch,
  aiError,
  aiAnswer,
  referencePages,
  setPdfPageNumber,
}) => (
  <div className={clsx(styles.splitLayoutContainer, "gap-6")}>
    {/* Main Document Viewer */}
    <div className={clsx(styles.splitMainPanel, "flex-1 flex flex-col")}>
      {selectedDoc ? (
        <div className="flex-1 bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-purple-500/30 transition-all duration-300">
          <iframe
            key={pdfPageNumber}
            src={getPdfSrcWithPage(selectedDoc.url, pdfPageNumber)}
            className="w-full h-full border-0 rounded-xl"
            title={selectedDoc.title}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-purple-500/30 transition-all duration-300">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Select a document to view</p>
        </div>
      )}
    </div>

    {!isRightSidebarCollapsed && (
      <>
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
          <div className={styles.sidebarHeader}>
            <div className="flex items-center gap-3">
              <Brain className="w-9 h-9 text-purple-600 dark:text-purple-400 p-1.5 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/20 rounded-xl" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Simple Query</h2>
              </div>
            </div>
          </div>

          <div className={clsx(styles.sidebarBody, "space-y-5")}>
            <form onSubmit={handleAiSearch} className="space-y-4">
              <div className="flex flex-col space-y-3 bg-white/60 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200/70 dark:border-purple-500/20">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide uppercase">Search Scope</label>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="document"
                      checked={searchScope === "document"}
                      onChange={(e) => setSearchScope(e.target.value as "document" | "company")}
                      className="mr-3 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Current Document
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="company"
                      checked={searchScope === "company"}
                      onChange={(e) => setSearchScope(e.target.value as "document" | "company")}
                      className="mr-3 text-purple-600 focus:ring-purple-500 w-4 h-4"
                      disabled={!companyId}
                    />
                    <span className={clsx(
                      "text-sm transition-colors",
                      !companyId
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    )}>
                      All Company Docs
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide uppercase">Response Style</label>
                <select
                  value={aiStyle}
                  onChange={(e) => setAiStyle(e.target.value)}
                  className="border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-xl p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
                >
                  {Object.entries(styleOptions).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                placeholder={
                  searchScope === "company" 
                    ? "Ask about all company docs..." 
                    : selectedDoc 
                      ? `Ask about "${selectedDoc.title}"...`
                      : "Select a document first..."
                }
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                rows={4}
                className="border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 rounded-xl p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-200 font-medium"
              />
              <button
                type="submit"
                disabled={aiLoading || (searchScope === "document" && !selectedDoc) || (searchScope === "company" && !companyId)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {aiLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Asking AI...
                  </span>
                ) : "Ask AI"}
              </button>
            </form>

            {aiError && <p className="text-red-500 text-sm font-medium">{aiError}</p>}

            {aiAnswer && (
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-purple-900/20 rounded-xl p-4 border border-gray-200 dark:border-purple-500/30 space-y-3">
                <MarkdownMessage
                  content={aiAnswer}
                  className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                />

                {referencePages.length > 0 && (
                  <div className="pt-3 border-t border-gray-300 dark:border-slate-600 space-y-2">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Reference Pages</p>
                    <div className="flex flex-wrap gap-2">
                      {referencePages.map((page, idx) => (
                        <button
                          key={`ref-page-${page}-${idx}`}
                          onClick={() => setPdfPageNumber(page)}
                          className="inline-flex items-center bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                        >
                          Page {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    )}

    {/* Reopen Button for Collapsed Right Sidebar */}
    {isRightSidebarCollapsed && (
      <button
        onClick={() => setIsRightSidebarCollapsed(false)}
        className={clsx(styles.reopenButton, "right-4 top-1/2 -translate-y-1/2 rounded-l-lg")}
        title="Open Query Panel"
      >
        <Brain className="w-5 h-5" />
        <span className="text-sm font-medium">Query</span>
      </button>
    )}
  </div>
);

