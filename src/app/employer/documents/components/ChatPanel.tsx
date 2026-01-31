"use client";

import { 
  MessageCircle, 
  Send, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  FileText, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Paperclip, 
  Search,
  Settings2,
  Layout,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '~/app/employer/documents/components/ui/button';
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
import { AgentChatInterface } from './AgentChatInterface';
import type { DocumentType } from '../types';

interface ChatPanelProps {
  userId: string;
  selectedDoc: DocumentType | null;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  aiStyle: string;
  setAiStyle: (s: string) => void;
  aiPersona: string;
  setAiPersona: (p: any) => void;
  searchScope: 'document' | 'company';
  setSearchScope: (s: 'document' | 'company') => void;
  companyId: number | null;
  setPdfPageNumber: (p: number) => void;
  styleOptions: Record<string, string>;
  onCreateChat: () => Promise<string | null>;
  isPreviewCollapsed?: boolean;
  onTogglePreview?: () => void;
}

export function ChatPanel({
  userId,
  selectedDoc,
  currentChatId,
  setCurrentChatId: _setCurrentChatId,
  aiStyle,
  setAiStyle,
  aiPersona,
  setAiPersona,
  searchScope,
  setSearchScope,
  companyId,
  setPdfPageNumber,
  styleOptions,
  onCreateChat,
  isPreviewCollapsed,
  onTogglePreview
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-white dark:bg-gray-950 transition-all duration-300">
      {/* Chat Header/Settings - Now part of flex flow */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 z-20 transition-all duration-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">AI Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
              <button
                onClick={() => setSearchScope('document')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  searchScope === 'document' 
                    ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                Document
              </button>
              <button
                onClick={() => setSearchScope('company')}
                disabled={!companyId}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  searchScope === 'company' 
                    ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm" 
                    : "text-gray-400 hover:text-gray-600",
                  !companyId && "opacity-50 cursor-not-allowed"
                )}
              >
                Company
              </button>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

            <div className="hidden sm:flex items-center gap-2">
              <Select value={aiStyle} onValueChange={setAiStyle}>
                <SelectTrigger className="h-9 w-[140px] bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:ring-0">
                  <Settings2 className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(styleOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs uppercase font-bold tracking-wider">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={aiPersona} onValueChange={setAiPersona}>
                <SelectTrigger className="h-9 w-[160px] bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:ring-0">
                  <Layout className="w-3.5 h-3.5 mr-2 text-purple-600" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general" className="text-xs font-bold uppercase tracking-wider">General</SelectItem>
                  <SelectItem value="learning-coach" className="text-xs font-bold uppercase tracking-wider">Learning Coach</SelectItem>
                  <SelectItem value="financial-expert" className="text-xs font-bold uppercase tracking-wider">Financial Expert</SelectItem>
                  <SelectItem value="legal-expert" className="text-xs font-bold uppercase tracking-wider">Legal Expert</SelectItem>
                  <SelectItem value="math-reasoning" className="text-xs font-bold uppercase tracking-wider">Math Reasoning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePreview}
              className="h-9 w-9 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600"
              title={isPreviewCollapsed ? "Show Document Preview" : "Hide Document Preview"}
            >
              {isPreviewCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

          {/* Messages Area - Now occupies remaining space */}
          <div className="flex-1 relative overflow-hidden">
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
              onCreateChat={onCreateChat}
            />
          </div>
    </div>
  );
}


