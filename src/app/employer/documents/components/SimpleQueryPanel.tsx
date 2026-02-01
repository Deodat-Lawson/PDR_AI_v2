"use client";

import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  setAiError: _setAiError,
  aiLoading,
  handleAiSearch,
  searchScope,
  setSearchScope,
  aiStyle,
  setAiStyle,
  styleOptions,
  referencePages: _referencePages,
  setPdfPageNumber: _setPdfPageNumber
}: SimpleQueryPanelProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="bg-background flex flex-col h-full border-l border-border">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground leading-tight">AI Simple Query</h2>
            <p className="text-xs text-muted-foreground font-medium">
              One-off questions with focused answers
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Query Settings */}
          <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                  Scope
                </Label>
                <Select value={searchScope} onValueChange={(v: 'document' | 'company') => setSearchScope(v)}>
                  <SelectTrigger className="h-10 bg-background border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document" className="text-xs">Current Doc</SelectItem>
                    <SelectItem value="company" className="text-xs" disabled={!companyId}>All Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                  Style
                </Label>
                <Select value={aiStyle} onValueChange={setAiStyle}>
                  <SelectTrigger className="h-10 bg-background border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-purple-500">
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
                  "min-h-[120px] resize-none bg-background border-border rounded-xl p-4 text-sm transition-all duration-300",
                  isFocused && "border-purple-300 dark:border-purple-800 ring-4 ring-purple-500/5 shadow-lg"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleAiSearch(e as unknown as React.FormEvent);
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-bold hidden sm:inline-block">Press Enter ↵</span>
                <Button
                  onClick={(e) => { void handleAiSearch(e); }}
                  disabled={!aiQuestion.trim() || aiLoading || (searchScope === 'document' && !selectedDoc)}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/20",
                    aiLoading ? "bg-muted text-muted-foreground" : "bg-purple-600 hover:bg-purple-700 text-white"
                  )}
                >
                  {aiLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-destructive leading-relaxed">
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
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Response</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest px-2" onClick={() => {
                    setAiAnswer('');
                    setAiQuestion('');
                  }}>
                    Clear
                  </Button>
                </div>
                
                <div className="bg-muted/30 p-5 rounded-3xl border border-border shadow-sm transition-all hover:shadow-md">
                  <MarkdownMessage
                    content={aiAnswer}
                    className="text-sm leading-relaxed text-foreground"
                  />
                </div>
              </div>
            ) : !aiLoading && (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mb-4 transition-all hover:scale-110 hover:rotate-3">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Ready to assist</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                  Ask questions and get instant insights from your documents using PDR AI.
                </p>
              </div>
            )}

            {aiLoading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-20 bg-muted/50 rounded-3xl" />
                  <div className="h-4 w-2/3 bg-muted/50 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}


