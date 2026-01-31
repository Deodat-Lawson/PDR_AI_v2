"use client";

import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Home, 
  ChevronLeft, 
  BarChart3, 
  Trash2, 
  MoreVertical, 
  MessageCircle,
  PenTool,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '~/app/employer/documents/components/ui/input';
import { Button } from '~/app/employer/documents/components/ui/button';
import { cn } from "~/lib/utils";
import { ThemeToggle } from '~/app/_components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/app/employer/documents/components/ui/dropdown-menu';
import { ChatSelector } from './ChatSelector';
import type { ViewMode, DocumentType, CategoryGroup } from '../types';

interface SidebarProps {
  categories: CategoryGroup[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDoc: DocumentType | null;
  setSelectedDoc: (doc: DocumentType | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleCategory?: (categoryName: string) => void;
  deleteDocument?: (docId: number) => void;
  isCollapsed?: boolean;
  onCollapseToggle?: (collapsed: boolean) => void;
  userId?: string;
  currentChatId?: string | null;
  onSelectChat?: (chatId: string | null) => void;
  onNewChat?: () => void;
}

export function Sidebar({
  categories,
  searchTerm,
  setSearchTerm,
  selectedDoc,
  setSelectedDoc,
  viewMode,
  setViewMode,
  toggleCategory,
  deleteDocument,
  isCollapsed = false,
  onCollapseToggle,
  userId,
  currentChatId,
  onSelectChat,
  onNewChat
}: SidebarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-4 h-full transition-all duration-300 ease-in-out">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapseToggle?.(false)}
          className="w-10 h-10 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all active:scale-90 mb-2"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5 text-purple-600" />
        </Button>

        <div className="w-px h-4 bg-gray-100 dark:bg-gray-800 mx-auto" />

        <div className="flex flex-col gap-3 w-full px-2 mt-2">
          <Button
            variant={viewMode === 'with-ai-qa' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('with-ai-qa')}
            className={cn(
              "w-full h-10 rounded-xl transition-all duration-200",
              viewMode === 'with-ai-qa' ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-gray-400 hover:text-purple-600"
            )}
            title="AI Q&A"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === 'predictive-analysis' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('predictive-analysis')}
            className={cn(
              "w-full h-10 rounded-xl transition-all duration-200",
              viewMode === 'predictive-analysis' ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-gray-400 hover:text-purple-600"
            )}
            title="Predictive Analysis"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === 'generator' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('generator')}
            className={cn(
              "w-full h-10 rounded-xl transition-all duration-200",
              viewMode === 'generator' ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-gray-400 hover:text-purple-600"
            )}
            title="Document Generator"
          >
            <PenTool className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 pb-4">
          <ThemeToggle />
          <Link href="/employer/home">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
              <Home className="w-5 h-5 text-gray-400" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full w-full transition-all duration-300 ease-in-out overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">PDR AI</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapseToggle?.(true)}
              className="h-9 w-9 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all active:scale-90"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-purple-600" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
            isSearchFocused ? "text-purple-600" : "text-gray-400"
          )} />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-9 h-10 bg-gray-50 dark:bg-gray-900 border-none focus-visible:ring-1 focus-visible:ring-purple-500"
          />
        </div>
      </div>

      {/* View Options */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 px-2 tracking-widest">VIEW OPTIONS</div>
        <div className="flex flex-col gap-1">
          <Button
            variant={viewMode === 'with-ai-qa' ? 'default' : 'ghost'}
            className={cn(
              "justify-start gap-3 h-11 rounded-lg px-3 transition-all duration-200",
              viewMode === 'with-ai-qa' 
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20" 
                : "hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-400"
            )}
            onClick={() => setViewMode('with-ai-qa')}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium text-sm">AI Q&A</span>
          </Button>
          <Button
            variant={viewMode === 'predictive-analysis' ? 'default' : 'ghost'}
            className={cn(
              "justify-start gap-3 h-11 rounded-lg px-3 transition-all duration-200",
              viewMode === 'predictive-analysis' 
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20" 
                : "hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-400"
            )}
            onClick={() => setViewMode('predictive-analysis')}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium text-sm">Predictive Analysis</span>
          </Button>
          <Button
            variant={viewMode === 'generator' ? 'default' : 'ghost'}
            className={cn(
              "justify-start gap-3 h-11 rounded-lg px-3 transition-all duration-200 relative overflow-hidden group",
              viewMode === 'generator' 
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20" 
                : "hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-400"
            )}
            onClick={() => setViewMode('generator')}
          >
            <PenTool className="w-4 h-4" />
            <span className="font-medium text-sm">Document Generator</span>
            <div className="absolute top-1 right-1 px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-tighter rounded-sm scale-75 origin-top-right border border-amber-200 dark:border-amber-800">
              Dev
            </div>
          </Button>
        </div>
      </div>

      {/* Documents */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-6">
        <div>
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 px-2 tracking-widest uppercase flex items-center gap-2">
            <FileText className="w-3 h-3" />
            Documents
          </div>
          <div className="space-y-1">
            {/* All Documents option */}
            {(viewMode === "with-ai-qa") && (
              <button
                onClick={() => setSelectedDoc(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative overflow-hidden",
                  !selectedDoc
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                )}
              >
                {!selectedDoc && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-r-full" />}
                <FileText className={cn(
                  "w-4 h-4 transition-colors",
                  !selectedDoc ? "text-purple-600 dark:text-purple-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />
                <span className="truncate">All Documents</span>
              </button>
            )}

            {categories.map(category => (
              <div key={category.name} className="mt-2 group/category">
                <button
                  onClick={() => toggleCategory?.(category.name)}
                  className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 transition-all uppercase tracking-wider"
                >
                  <div className="transition-transform duration-200 group-hover/category:translate-x-0.5 flex items-center gap-2">
                    {category.isOpen ? (
                      <ChevronDown className="w-3 h-3 text-purple-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="truncate">{category.name}</span>
                  </div>
                </button>

                {category.isOpen && (
                  <div className="mt-1 space-y-0.5 ml-2 border-l border-gray-100 dark:border-gray-800 pl-1 animate-in slide-in-from-left-1 duration-200">
                    {category.documents.map(doc => (
                      <div
                        key={doc.id}
                        className={cn(
                          "group flex items-center gap-1 rounded-lg transition-all duration-200 relative overflow-hidden",
                          selectedDoc?.id === doc.id
                            ? "bg-purple-50 dark:bg-purple-900/20 shadow-sm"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        )}
                      >
                        {selectedDoc?.id === doc.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-r-full" />}
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className={cn(
                            "flex-1 flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200",
                            selectedDoc?.id === doc.id
                              ? "text-purple-700 dark:text-purple-300 font-bold"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <FileText className={cn(
                            "w-4 h-4 flex-shrink-0 transition-colors",
                            selectedDoc?.id === doc.id ? "text-purple-600 dark:text-purple-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                          )} />
                          <span className="flex-1 text-left truncate">{doc.title}</span>
                        </button>
                        
                        {deleteDocument && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity mr-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDocument(doc.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Document
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Chat History - Only show in AI Q&A mode */}
        {viewMode === "with-ai-qa" && userId && onSelectChat && onNewChat && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 animate-in fade-in duration-500">
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-4 px-2 tracking-widest uppercase flex items-center gap-2">
              <Clock className="w-3 h-3 text-purple-600" />
              Chat History
            </div>
            <div className="px-1">
              <ChatSelector
                userId={userId}
                currentChatId={currentChatId ?? null}
                onSelectChat={onSelectChat}
                onNewChat={onNewChat}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}


