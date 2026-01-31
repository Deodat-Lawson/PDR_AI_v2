"use client";

import React, { useState, useEffect } from 'react';
import { Send, Sparkles, FileText, Globe, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Button } from '~/app/employer/documents/components/ui/button';
import { Textarea } from '~/app/employer/documents/components/ui/textarea';
import { ScrollArea } from '~/app/employer/documents/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/app/employer/documents/components/ui/select';
import { Label } from '~/app/employer/documents/components/ui/label';
import { cn } from "~/lib/utils";
import { useAIChat } from '../hooks/useAIChat';
import MarkdownMessage from '~/app/_components/MarkdownMessage';
import type { DocumentType } from '../types';

interface SimpleQueryPanelProps {
  selectedDoc: DocumentType | null;
  companyId: number | null;
  aiQuestion: string;
  setAiQuestion: (q: string) => void;
  aiAnswer: string;
  setAiAnswer: (a: string) => void;
  aiError: string;
  setAiError: (e: string) => void;
  aiLoading: boolean;
  handleAiSearch: (e: React.FormEvent) => Promise<void>;
  searchScope: 'document' | 'company';
  setSearchScope: (s: 'document' | 'company') => void;
  aiStyle: string;
  setAiStyle: (s: string) => void;
  styleOptions: Record<string, string>;
  referencePages: number[];
  setPdfPageNumber: (p: number) => void;
}

export function SimpleQueryPanel({
  selectedDoc,
  companyId,
  aiQuestion,
  setAiQuestion,
  aiAnswer,
  setAiAnswer,
  aiError,
  setAiError,
  aiLoading,
  handleAiSearch,
  searchScope,
  setSearchScope,
  aiStyle,
  setAiStyle,
  styleOptions,
  referencePages,
  setPdfPageNumber
}: SimpleQueryPanelProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-950 flex flex-col h-full border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">AI Simple Query</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              One-off questions with focused answers
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Query Settings */}
          <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                  Scope
                </Label>
                <Select value={searchScope} onValueChange={(v: any) => setSearchScope(v)}>
                  <SelectTrigger className="h-10 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document" className="text-xs">Current Doc</SelectItem>
                    <SelectItem value="company" className="text-xs" disabled={!companyId}>All Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                  Style
                </Label>
                <Select value={aiStyle} onValueChange={setAiStyle}>
                  <SelectTrigger className="h-10 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(styleOptions).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 relative">
              <Textarea
                placeholder={
                  searchScope === 'company'
                    ? "Ask about all company documents..."
                    : selectedDoc
                    ? `Ask about "${selectedDoc.title}"...`
                    : "Ask a question..."
                }
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  "min-h-[120px] resize-none bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl p-4 text-sm transition-all duration-300",
                  isFocused && "border-purple-300 dark:border-purple-800 ring-4 ring-purple-500/5 shadow-lg"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSearch(e as any);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold hidden sm:inline-block">Press Enter ↵</span>
                <Button
                  onClick={(e) => handleAiSearch(e as any)}
                  disabled={!aiQuestion.trim() || aiLoading || (searchScope === 'document' && !selectedDoc)}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/20",
                    aiLoading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  {aiLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Response Section */}
          <div className="space-y-4">
            {aiError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-red-700 dark:text-red-400 leading-relaxed">
                  {aiError}
                </p>
              </div>
            )}

            {aiAnswer ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">AI Response</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest px-2" onClick={() => {
                    setAiAnswer('');
                    setAiQuestion('');
                  }}>
                    Clear
                  </Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-800/50 shadow-sm transition-all hover:shadow-md">
                  <MarkdownMessage
                    content={aiAnswer}
                    className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
            ) : !aiLoading && (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-4 transition-all hover:scale-110 hover:rotate-3">
                  <Sparkles className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                </div>
                <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Ready to assist</h4>
                <p className="text-xs text-gray-400 dark:text-gray-600 leading-relaxed max-w-[200px]">
                  Ask questions and get instant insights from your documents using PDR AI.
                </p>
              </div>
            )}

            {aiLoading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 w-24 bg-gray-100 dark:bg-gray-900 rounded-full" />
                <div className="space-y-2">
                  <div className="h-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl" />
                  <div className="h-4 w-2/3 bg-gray-50 dark:bg-gray-900/50 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}


