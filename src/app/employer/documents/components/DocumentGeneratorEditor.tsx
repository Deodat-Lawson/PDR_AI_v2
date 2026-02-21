"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Send,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "~/app/employer/documents/components/ui/resizable";
import { Button } from "~/app/employer/documents/components/ui/button";
import { Input } from "~/app/employer/documents/components/ui/input";
import { Textarea } from "~/app/employer/documents/components/ui/textarea";
import { cn } from "~/lib/utils";

// Import tool components
import {
  ToolPalette,
  ResearchPanel,
  CitationPanel,
  OutlinePanel,
  GrammarPanel,
  ExportDialog,
  InlineRewriteDiff,
  type ToolType,
  type AIAction,
  type Citation,
  type OutlineItem,
} from "./generator";

/** Extract sentence or paragraph at cursor when there is no selection (cursor rewrite). */
function extractTextAtCursor(text: string, cursorPos: number): { text: string; start: number; end: number } {
  if (text.length === 0) return { text: "", start: 0, end: 0 };
  const len = text.length;
  let start = cursorPos;
  let end = cursorPos;
  while (start > 0) {
    const c = text[start - 1] ?? "";
    const prev = text[start - 2] ?? "";
    if (c === "\n" && start > 1 && prev === "\n") break;
    if ([".", "!", "?"].includes(c) && (start <= 1 || /[\s\n]/.test(prev))) break;
    start--;
  }
  while (end < len) {
    const c = text[end] ?? "";
    const next = text[end + 1] ?? "";
    if (c === "\n" && end + 1 < len && next === "\n") break;
    if ([".", "!", "?"].includes(c)) {
      end++;
      break;
    }
    end++;
  }
  const raw = text.slice(start, end);
  const trimmed = raw.trim();
  if (!trimmed) return { text: "", start: cursorPos, end: cursorPos };
  const leadSpace = raw.length - raw.trimStart().length;
  const trailSpace = raw.trimEnd().length;
  return { text: trimmed, start: start + leadSpace, end: start + trailSpace };
}

interface DocumentGeneratorEditorProps {
  initialTitle: string;
  initialContent: string;
  initialCitations?: Citation[];
  documentId?: number;
  onBack: () => void;
  onSave: (title: string, content: string, citations?: Citation[]) => void;
  mode?: 'full' | 'rewrite';
}

export function DocumentGeneratorEditor({ 
  initialTitle, 
  initialContent,
  initialCitations = [],
  documentId: _documentId,
  onBack, 
  onSave,
  mode = 'full',
}: DocumentGeneratorEditorProps) {
  const isRewriteMode = mode === 'rewrite';
  // Core state
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [citations, setCitations] = useState<Citation[]>(initialCitations);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  
  // UI state
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [isToolPaletteCollapsed, setIsToolPaletteCollapsed] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);

  /** Rewrite preview: show diff, user must Accept or Reject. */
  const [rewritePreview, setRewritePreview] = useState<{
    originalText: string;
    proposedText: string;
    selectionStart: number;
    selectionEnd: number;
    prompt: string;
  } | null>(null);

  /** Undo stack for content (used so Accept is one undo step). */
  const contentHistoryRef = useRef<string[]>([]);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save (supports async onSave e.g. for Rewrite tab saving to API)
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(title, content, citations));
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [onSave, title, content, citations]);

  useEffect(() => {
    if (isRewriteMode) return; 
    const interval = setInterval(() => {
      void handleSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleSave, isRewriteMode]);

  // Keyboard shortcuts (including undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        const history = contentHistoryRef.current;
        if (history.length > 0 && contentRef.current === document.activeElement) {
          e.preventDefault();
          const prev = history.pop()!;
          setContent(prev);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setActiveTool("ai-generate");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Handle AI content generation
  const handleAIAction = async (action: AIAction, customPrompt?: string) => {
    setIsProcessing(true);
    const prompt = customPrompt ?? aiPrompt;

    let textToRewrite: string;
    let rewriteStart: number;
    let rewriteEnd: number;

    if (selectedText) {
      textToRewrite = selectedText;
      rewriteStart = selectionStart;
      rewriteEnd = selectionEnd;
    } else {
      const cursorPos = contentRef.current?.selectionStart ?? content.length;
      const extracted = extractTextAtCursor(content, cursorPos);
      textToRewrite = extracted.text;
      rewriteStart = extracted.start;
      rewriteEnd = extracted.end;
    }

    if (prompt) {
      setChatMessages((prev) => [...prev, { role: "user", content: prompt }]);
      setAiPrompt("");
    }

    try {
      const response = await fetch("/api/document-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          content: textToRewrite || content.slice(-500),
          prompt,
          context: {
            documentTitle: title,
            fullContent: content.slice(0, 3000),
            cursorPosition: selectionEnd,
          },
          options: { tone: "professional", length: "medium" },
        }),
      });

      const data = (await response.json()) as { success: boolean; generatedContent?: string };

      if (data.success && data.generatedContent) {
        const generatedContent = data.generatedContent;

        if (action === "rewrite" && textToRewrite.trim()) {
          setRewritePreview({
            originalText: textToRewrite,
            proposedText: generatedContent,
            selectionStart: rewriteStart,
            selectionEnd: rewriteEnd,
            prompt: prompt ?? "",
          });
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: "When you're ready—check the preview above your document and click Accept to apply or Reject to discard. No rush!" },
          ]);
          return;
        }

        if (selectedText && (action === "expand" || action === "summarize" || action === "change_tone")) {
          const newContent =
            content.substring(0, selectionStart) + generatedContent + content.substring(selectionEnd);
          setContent(newContent);
        } else {
          setContent((prev) => prev + "\n\n" + generatedContent);
        }

        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I've ${action === "generate_section" ? "generated a new section" : action === "continue" ? "continued writing" : `${action}ed the text`}. The changes have been applied to your document.`,
          },
        ]);
      }
    } catch (error) {
      console.error("AI generation error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error generating content. Please try again." },
      ]);
    } finally {
      setIsProcessing(false);
      if (action !== "rewrite") setSelectedText("");
    }
  };

  const handleAIRequest = async () => {
    if (!aiPrompt.trim()) return;
    
    // Determine action based on context
    const action: AIAction = selectedText ? 'rewrite' : 'continue';
    await handleAIAction(action, aiPrompt);
  };

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRewritePreview(null); 
    setContent(e.target.value);
  }, []);

  const handleRewriteAccept = useCallback(() => {
    if (!rewritePreview) return;
    contentHistoryRef.current.push(content);
    const newContent =
      content.slice(0, rewritePreview.selectionStart) +
      rewritePreview.proposedText +
      content.slice(rewritePreview.selectionEnd);
    setContent(newContent);
    setRewritePreview(null);
    setSelectedText("");
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Rewrite applied. Use Cmd+Z to undo." },
    ]);
  }, [rewritePreview, content]);

  const handleRewriteReject = useCallback(() => {
    setRewritePreview(null);
  }, []);

  const [isRetryingRewrite, setIsRetryingRewrite] = useState(false);
  const handleRewriteTryAgain = useCallback(async () => {
    if (!rewritePreview) return;
    setIsRetryingRewrite(true);
    try {
      const response = await fetch("/api/document-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite",
          content: rewritePreview.originalText,
          prompt: rewritePreview.prompt,
          context: { documentTitle: title, fullContent: content.slice(0, 3000) },
          options: { tone: "professional", length: "medium" },
        }),
      });
      const data = (await response.json()) as { success: boolean; generatedContent?: string };
      if (data.success && data.generatedContent) {
        setRewritePreview((p) => (p ? { ...p, proposedText: data.generatedContent! } : null));
      }
    } finally {
      setIsRetryingRewrite(false);
    }
  }, [rewritePreview, title, content]);

  // Handle text selection
  const handleTextSelection = () => {
    if (!contentRef.current) return;
    
    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    
    if (start !== end) {
      setSelectedText(content.substring(start, end));
      setSelectionStart(start);
      setSelectionEnd(end);
    } else {
      setSelectedText('');
    }
  };

  // Handle inserting content from research
  const handleInsertContent = (insertContent: string, citation?: { title: string; url?: string }) => {
    const cursorPos = contentRef.current?.selectionStart ?? content.length;
    const newContent = content.substring(0, cursorPos) + '\n\n' + insertContent + '\n\n' + content.substring(cursorPos);
    setContent(newContent);
    
    // Add citation if provided
    if (citation) {
      const newCitation: Citation = {
        id: Date.now().toString(),
        sourceType: citation.url ? 'website' : 'document',
        title: citation.title,
        url: citation.url,
        accessDate: new Date().toISOString().split('T')[0],
      };
      setCitations(prev => [...prev, newCitation]);
    }
  };

  // Handle inserting citation
  const handleInsertCitation = (inTextCitation: string) => {
    const cursorPos = contentRef.current?.selectionStart ?? content.length;
    const newContent = content.substring(0, cursorPos) + inTextCitation + content.substring(cursorPos);
    setContent(newContent);
  };

  // Handle grammar suggestion
  const handleApplySuggestion = (original: string, suggestion: string) => {
    const newContent = content.replace(original, suggestion);
    setContent(newContent);
  };

  // Handle outline section insertion
  const handleInsertSection = (sectionTitle: string, level: number) => {
    const markdown = '#'.repeat(level) + ' ' + sectionTitle + '\n\n';
    const cursorPos = contentRef.current?.selectionStart ?? content.length;
    const newContent = content.substring(0, cursorPos) + '\n\n' + markdown + content.substring(cursorPos);
    setContent(newContent);
  };

  // Handle tool selection
  const handleToolSelect = (tool: ToolType) => {
    if (tool === 'export') {
      setIsExportOpen(true);
    } else {
      setActiveTool(activeTool === tool ? null : tool);
    }
  };

  // Render the active tool panel
  const renderToolPanel = () => {
    switch (activeTool) {
      case 'doc-research':
        return (
          <ResearchPanel
            onInsertContent={handleInsertContent}
            onClose={() => setActiveTool(null)}
            initialMode="documents"
          />
        );
      case 'web-research':
        return (
          <ResearchPanel
            onInsertContent={handleInsertContent}
            onClose={() => setActiveTool(null)}
            initialMode="web"
          />
        );
      case 'arxiv-research':
        return (
          <ResearchPanel
            onInsertContent={handleInsertContent}
            onClose={() => setActiveTool(null)}
            initialMode="arxiv"
          />
        );
      case 'citation':
        return (
          <CitationPanel
            citations={citations}
            onCitationsChange={setCitations}
            onInsertCitation={handleInsertCitation}
            onClose={() => setActiveTool(null)}
          />
        );
      case 'outline':
        return (
          <OutlinePanel
            outline={outline}
            documentTitle={title}
            documentDescription=""
            onOutlineChange={setOutline}
            onInsertSection={handleInsertSection}
            onClose={() => setActiveTool(null)}
          />
        );
      case 'grammar':
        return (
          <GrammarPanel
            content={content}
            onApplySuggestion={handleApplySuggestion}
            onClose={() => setActiveTool(null)}
          />
        );
      default:
        return null;
    }
  };

  const quickActions = [
    { label: 'Generate Section', action: 'generate_section' as AIAction },
    { label: 'Continue Writing', action: 'continue' as AIAction },
  ];

  const editActions = [
    { label: 'Expand', action: 'expand' as AIAction },
    { label: 'Rewrite', action: 'rewrite' as AIAction },
    { label: 'Summarize', action: 'summarize' as AIAction },
    { label: 'Make Professional', action: 'change_tone' as AIAction },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {!isRewriteMode && (
          <>
            <ResizablePanel 
              defaultSize={isToolPaletteCollapsed ? 4 : 15} 
              minSize={isToolPaletteCollapsed ? 4 : 12} 
              maxSize={isToolPaletteCollapsed ? 4 : 20}
            >
              <ToolPalette
                activeTool={activeTool}
                onToolSelect={handleToolSelect}
                onAIAction={handleAIAction}
                hasSelection={selectedText.length > 0}
                isCollapsed={isToolPaletteCollapsed}
                onToggleCollapse={() => setIsToolPaletteCollapsed(!isToolPaletteCollapsed)}
              />
            </ResizablePanel>
            <ResizableHandle className="w-px bg-border" />
          </>
        )}

        {/* Main Editor */}
        <ResizablePanel defaultSize={activeTool && !isRewriteMode ? 50 : isRewriteMode ? 65 : 55} minSize={40}>
          <div className="flex flex-col h-full bg-background">
            {/* Toolbar */}
            <div className="flex-shrink-0 border-b border-border">
              {/* Top Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <div className="h-6 w-px bg-border" />
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-0 focus-visible:ring-0 font-medium text-lg px-2 bg-transparent text-foreground max-w-[300px]"
                    placeholder={isRewriteMode ? "Add a title (optional)" : "Untitled Document"}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => void handleSave()} 
                    disabled={isSaving}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isRewriteMode ? "Save to Documents" : "Save"}
                  </Button>
                </div>
              </div>

              {/* Formatting Bar */}
              <div className="flex items-center gap-1 px-4 py-2 bg-background/50 backdrop-blur-sm">
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Bold">
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Italic">
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Underline">
                  <Underline className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Bullet List">
                  <List className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Numbered List">
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Align Left">
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Align Center">
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground" title="Align Right">
                  <AlignRight className="w-4 h-4" />
                </Button>
                
                {/* Word count */}
                <div className="ml-auto text-xs text-muted-foreground">
                  {content.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </div>

            {/* Editor Content - when rewrite preview active, show before|diff|after inline in document */}
            <div className="flex-1 bg-muted/30 overflow-y-auto custom-scrollbar">
              <div className="py-8 px-4">
                <div
                  className="max-w-[816px] mx-auto bg-card shadow-xl min-h-[1056px] px-24 py-20 border border-border/50 text-base leading-relaxed text-foreground"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {rewritePreview ? (
                    <div className="whitespace-pre-wrap">
                      {content.slice(0, rewritePreview.selectionStart)}
                      <InlineRewriteDiff
                        originalText={rewritePreview.originalText}
                        proposedText={rewritePreview.proposedText}
                        onAccept={handleRewriteAccept}
                        onReject={handleRewriteReject}
                        onTryAgain={handleRewriteTryAgain}
                        isRetrying={isRetryingRewrite}
                      />
                      {content.slice(rewritePreview.selectionEnd)}
                    </div>
                  ) : (
                    <Textarea
                      ref={contentRef}
                      value={content}
                      onChange={handleContentChange}
                      onSelect={handleTextSelection}
                      className="w-full min-h-[900px] border-0 focus-visible:ring-0 resize-none text-base leading-relaxed bg-transparent text-foreground"
                      placeholder={isRewriteMode ? "Paste or type text here, then select and use the AI panel to rewrite..." : "Start writing or use the AI tools to help you..."}
                      style={{ fontFamily: "Georgia, serif" }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border" />

        {/* Tool Panel or AI Assistant - in rewrite mode always show AI Assistant */}
        <ResizablePanel defaultSize={activeTool && activeTool !== 'ai-generate' && !isRewriteMode ? 30 : isRewriteMode ? 35 : 30} minSize={25} maxSize={45}>
          {activeTool && activeTool !== 'ai-generate' && !isRewriteMode ? (
            renderToolPanel()
          ) : (
            <div className="bg-background border-l border-border flex flex-col h-full">
              {/* Header */}
              <div className="flex-shrink-0 p-4 border-b border-border bg-background/50 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-foreground">AI Assistant</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRewriteMode
                    ? (selectedText ? 'Selected text - Ask AI to rewrite it' : 'Paste or type text, then select and ask AI to rewrite')
                    : (selectedText ? 'Selected text - Ask AI to edit it' : 'Ask AI to add content')}
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {chatMessages.length === 0 && !rewritePreview && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          How to use AI
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Select text to ask AI to edit it</li>
                          <li>• Type requests to add new content</li>
                          <li>• Use quick actions below</li>
                          <li>• Press ⌘K for quick access</li>
                        </ul>
                      </div>

                      {selectedText ? (
                        <div>
                          <p className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-widest">
                            EDIT SELECTED TEXT
                          </p>
                          <div className="space-y-2">
                            {editActions.map((action) => (
                              <Button
                                key={action.label}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-sm border-border text-muted-foreground hover:text-foreground"
                                onClick={() => void handleAIAction(action.action)}
                                disabled={isProcessing}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-widest">
                            QUICK ACTIONS
                          </p>
                          <div className="space-y-2">
                            {quickActions.map((action) => (
                              <Button
                                key={action.label}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-sm border-border text-muted-foreground hover:text-foreground"
                                onClick={() => void handleAIAction(action.action)}
                                disabled={isProcessing}
                              >
                                <Sparkles className="w-3 h-3 mr-2 text-purple-600" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-2xl shadow-sm border border-border/50",
                        message.role === 'user'
                          ? "bg-purple-100 dark:bg-purple-900/30 ml-4 border-purple-200/50"
                          : "bg-muted/50 mr-4"
                      )}
                    >
                      <p className="text-[10px] font-black mb-1 text-muted-foreground uppercase tracking-widest">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI is processing...
                    </div>
                  )}
                </div>
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-4 border-t border-border bg-background">
                <div className="space-y-2">
                  {selectedText && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100/50 dark:border-purple-900/50 text-[10px]">
                      <p className="font-black mb-1 uppercase tracking-widest text-purple-600 dark:text-purple-400">Selected Text</p>
                      <p className="text-muted-foreground line-clamp-2 italic">
                        &quot;{selectedText}&quot;
                      </p>
                    </div>
                  )}
                  <Textarea
                    placeholder={selectedText ? "Ask AI to edit selection..." : "Ask AI to add content..."}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="resize-none bg-muted/30 border-border rounded-xl focus-visible:ring-purple-500"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleAIRequest();
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleAIRequest()}
                    disabled={!aiPrompt.trim() || isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 rounded-xl"
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={title}
        content={content}
        bibliography={citations.length > 0 ? citations.map(c => c.title).join('\n') : undefined}
      />
    </div>
  );
}
