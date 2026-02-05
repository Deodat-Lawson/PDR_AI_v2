// DocumentViewer/DocumentsSidebar.tsx
"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  LogOut,
  Eye,
  MessageCircle,
  History,
  BarChart3,
  ChevronLeft,
  FolderOpen,
  Layers,
} from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { type ViewMode } from "./types";
import { ThemeToggle } from "~/app/_components/ThemeToggle";
import { cn } from "~/lib/utils";

interface DocumentType {
  id: number;
  title: string;
  category: string;
  aiSummary?: string;
  url: string;
}

interface CategoryGroup {
  name: string;
  isOpen: boolean;
  documents: DocumentType[];
}

interface DocumentsSidebarProps {
  categories: CategoryGroup[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedDoc: DocumentType | null;
  setSelectedDoc: (doc: DocumentType) => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  toggleCategory?: (categoryName: string) => void;
}

interface ViewModeConfig {
  mode: ViewMode;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  description: string;
}

const viewModeConfigs: ViewModeConfig[] = [
  {
    mode: "document-only",
    icon: Eye,
    label: "View",
    description: "Document viewer"
  },
  {
    mode: "with-ai-qa",
    icon: MessageCircle,
    label: "Q&A",
    description: "Ask AI questions"
  },
  {
    mode: "with-ai-qa-history",
    icon: History,
    label: "History",
    description: "Past conversations"
  },
  {
    mode: "predictive-analysis",
    icon: BarChart3,
    label: "Analysis",
    description: "Smart insights"
  }
];

export const DocumentsSidebar: React.FC<DocumentsSidebarProps> = ({
  categories,
  searchTerm,
  setSearchTerm,
  selectedDoc,
  setSelectedDoc,
  viewMode,
  setViewMode,
  toggleCategory,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (toggleCategory) {
      toggleCategory(categoryName);
    }
  };

  // Collapsed state
  if (isCollapsed) {
    return (
      <aside className="w-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-out">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 z-50 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all duration-200"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-3 h-3 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Logo */}
        <div className="p-4 flex justify-center border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* View Mode Icons */}
        <div className="p-3 space-y-2">
          {viewModeConfigs.map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "w-full h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                viewMode === mode
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-600"
              )}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto p-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
          <div className="flex justify-center">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                variables: {
                  colorPrimary: "#8B5CF6",
                },
              }}
            />
          </div>
        </div>
      </aside>
    );
  }

  // Expanded state
  return (
    <aside className="w-80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-out">
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 z-50 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all duration-200"
        aria-label="Collapse sidebar"
      >
        <ChevronLeft className="w-3 h-3 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Header */}
      <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform hover:scale-105">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              PDR AI
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
              Document Hub
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200",
              isSearchFocused ? "text-violet-600 scale-110" : "text-slate-400"
            )}
          />
          <input
            type="text"
            placeholder="Search documents..."
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              "bg-slate-100/80 dark:bg-slate-800/80 border-2 border-transparent",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "text-slate-700 dark:text-slate-200",
              "focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-violet-500/50",
              "focus:shadow-lg focus:shadow-violet-500/10"
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
            View Mode
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {viewModeConfigs.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                viewMode === mode
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/50 hover:text-violet-600 dark:hover:text-violet-400"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <div className="flex items-center gap-2 px-1">
          <FolderOpen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
            Documents
          </span>
        </div>

        {/* All Documents Option */}
        {(viewMode === "with-ai-qa" || viewMode === "with-ai-qa-history") && (
          <button
            onClick={() => setSelectedDoc(null as unknown as DocumentType)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group",
              !selectedDoc
                ? "bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {!selectedDoc && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-600 to-indigo-600 rounded-r-full" />
            )}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              !selectedDoc
                ? "bg-violet-600/20 dark:bg-violet-500/20"
                : "bg-slate-200/80 dark:bg-slate-700/50 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30"
            )}>
              <FileText className={cn(
                "w-4 h-4 transition-colors",
                !selectedDoc ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400 group-hover:text-violet-600"
              )} />
            </div>
            <span>All Documents</span>
          </button>
        )}

        {/* Categories */}
        {categories.map((category) => (
          <div key={category.name} className="space-y-1">
            <button
              onClick={() => handleCategoryClick(category.name)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
            >
              <div className="transition-transform duration-200">
                {category.isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                )}
              </div>
              <span className="truncate">{category.name}</span>
              <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                {category.documents.length}
              </span>
            </button>

            {category.isOpen && (
              <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {category.documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group",
                      selectedDoc?.id === doc.id
                        ? "bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {selectedDoc?.id === doc.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-600 to-indigo-600 rounded-r-full" />
                    )}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      selectedDoc?.id === doc.id
                        ? "bg-violet-600/20 dark:bg-violet-500/20"
                        : "bg-slate-200/80 dark:bg-slate-700/50 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30"
                    )}>
                      <FileText className={cn(
                        "w-4 h-4 transition-colors",
                        selectedDoc?.id === doc.id ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400 group-hover:text-violet-600"
                      )} />
                    </div>
                    <span className="truncate text-left">{doc.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-t from-slate-100/50 to-transparent dark:from-slate-800/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                variables: {
                  colorPrimary: "#8B5CF6",
                  borderRadius: "0.75rem",
                },
                elements: {
                  userButtonAvatarBox: "w-9 h-9 border-2 border-violet-200 dark:border-violet-800",
                  userButtonTrigger: "hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors rounded-xl p-1",
                },
              }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Employee
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                View documents
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200">
                <LogOut className="w-4 h-4" />
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        @keyframes slide-in-from-top-2 {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: slide-in-from-top-2 0.2s ease-out forwards;
        }
      `}</style>
    </aside>
  );
};
