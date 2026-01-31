"use client";

import React from 'react';
import { FileText, Download, Share2, ZoomIn, ZoomOut, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '~/app/employer/documents/components/ui/button';
import { ScrollArea } from '~/app/employer/documents/components/ui/scroll-area';
import { cn } from "~/lib/utils";
import type { DocumentType } from '../types';

interface DocumentViewerProps {
  document: DocumentType | null;
  pdfPageNumber?: number;
  setPdfPageNumber?: (page: number) => void;
  hideActions?: boolean;
  minimal?: boolean;
  isCollapsed?: boolean;
}

export function DocumentViewer({ 
  document, 
  pdfPageNumber = 1, 
  setPdfPageNumber,
  hideActions = false,
  minimal = false,
  isCollapsed = false
}: DocumentViewerProps) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 bg-muted/20 h-full border-l border-border animate-in fade-in duration-300">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 shadow-sm">
          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 flex items-center justify-center [writing-mode:vertical-rl] text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-50">
          Document Preview
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950/50 h-full p-8 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-700" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Document Selected</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs text-sm font-medium">
          Select a document from the sidebar to view its content and start your analysis.
        </p>
      </div>
    );
  }

  const getPdfSrcWithPage = (url: string, page: number) => `${url}#page=${page}`;

  return (
    <div className="flex flex-col bg-background h-full overflow-hidden transition-all duration-300">
      {/* Document Header - Clean and minimal */}
      {!minimal && (
        <div className="bg-background border-b border-border px-6 py-3 flex-shrink-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-sm font-semibold truncate text-foreground leading-none">
                  {document.title}
                </h1>
                <span className="px-1.5 py-0.5 bg-muted text-[10px] text-muted-foreground rounded capitalize font-medium">
                  {document.category}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span>Browser Native Viewer</span>
            </div>
          </div>
        </div>
      )}

      {/* Document Content - Flush with edges for better binding */}
      <div className="flex-1 relative bg-muted/30 overflow-hidden">
        <iframe
          key={`${document.id}-${pdfPageNumber}`}
          src={getPdfSrcWithPage(document.url, pdfPageNumber)}
          className="w-full h-full border-0"
          title={document.title}
        />
      </div>
    </div>
  );
}


