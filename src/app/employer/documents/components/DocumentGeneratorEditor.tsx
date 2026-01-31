import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Share2,
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
  Loader2
} from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "~/app/employer/documents/components/ui/resizable";
import { Button } from "~/app/employer/documents/components/ui/button";
import { Input } from "~/app/employer/documents/components/ui/input";
import { Textarea } from "~/app/employer/documents/components/ui/textarea";
import { cn } from "~/lib/utils";

interface DocumentGeneratorEditorProps {
  initialTitle: string;
  initialContent: string;
  onBack: () => void;
  onSave: (title: string, content: string) => void;
}

export function DocumentGeneratorEditor({ 
  initialTitle, 
  initialContent, 
  onBack, 
  onSave 
}: DocumentGeneratorEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);

  const handleSave = useCallback(() => {
    onSave(title, content);
  }, [onSave, title, content]);

  useEffect(() => {
    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleSave]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAIRequest = async () => {
    if (!aiPrompt.trim()) return;

    setIsProcessing(true);
    const userMessage = aiPrompt;
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiPrompt('');

    // Simulate AI processing
    setTimeout(() => {
      const hasSelection = selectedText.length > 0;
      let updatedContent = content;
      let aiResponse = '';

      if (hasSelection) {
        // AI is editing selected text
        const modifications = [
          { prompt: 'more concise', result: selectedText.split(' ').slice(0, Math.floor(selectedText.split(' ').length * 0.6)).join(' ') + '.' },
          { prompt: 'more detailed', result: selectedText + ' This provides additional context and elaboration on the key concepts discussed, offering deeper insights into the subject matter.' },
          { prompt: 'more professional', result: selectedText.replace(/\b(good|bad|nice|cool)\b/gi, match => {
            const replacements: Record<string, string> = {
              'good': 'excellent', 'bad': 'suboptimal', 'nice': 'favorable', 'cool': 'innovative'
            };
            return replacements[match.toLowerCase()] ?? match;
          })},
          { prompt: 'simpler', result: selectedText.split(' ').map(word => word.length > 12 ? 'simple' : word).join(' ') },
        ];

        const matchedMod = modifications.find(m => userMessage.toLowerCase().includes(m.prompt));
        
        if (matchedMod) {
          updatedContent = content.substring(0, selectionStart) + matchedMod.result + content.substring(selectionEnd);
          aiResponse = `I've updated the selected text to make it ${matchedMod.prompt}. The changes have been applied to your document.`;
        } else {
          updatedContent = content.substring(0, selectionStart) + 
                          `${selectedText} [AI Enhancement: Based on your request, I suggest adding more context here.]` + 
                          content.substring(selectionEnd);
          aiResponse = `I've enhanced the selected text based on your request. Please review the changes and let me know if you'd like any adjustments.`;
        }
      } else {
        // AI is adding new content
        const additionalContent = generateAIContent(userMessage);
        updatedContent = content + '\n\n' + additionalContent;
        aiResponse = `I've added new content based on your request. The text has been appended to the end of your document.`;
      }

      setContent(updatedContent);
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsProcessing(false);
    }, 2000);
  };

  const generateAIContent = (prompt: string): string => {
    const prompts: Record<string, string> = {
      'introduction': '## Introduction\n\nThis section provides a comprehensive overview of the topic at hand. It establishes the context and sets the stage for the detailed analysis that follows. Understanding these foundational concepts is crucial for grasping the more complex ideas presented later.',
      'conclusion': '## Conclusion\n\nIn conclusion, this document has explored the key aspects of the subject matter. The insights presented here demonstrate the importance of careful consideration and strategic planning. Moving forward, these principles will serve as a valuable foundation for future work.',
      'summary': '## Summary\n\nThis summary highlights the main points discussed throughout the document:\n\n- Key finding 1: Essential insights and observations\n- Key finding 2: Important trends and patterns\n- Key finding 3: Significant implications and recommendations\n\nThese elements combine to form a comprehensive understanding of the topic.',
      'example': '## Example\n\nTo illustrate this concept, consider the following real-world example:\n\nA company faced with similar challenges implemented a strategic approach that resulted in measurable improvements. By focusing on key metrics and maintaining clear communication, they achieved a 40% increase in efficiency within six months.',
    };

    for (const [key, value] of Object.entries(prompts)) {
      if (prompt.toLowerCase().includes(key)) {
        return value;
      }
    }

    return `## AI-Generated Content\n\nBased on your request: "${prompt}"\n\nThis section has been generated to address your needs. The content is structured to provide clear, actionable information that aligns with your document's overall objectives. You can edit this text as needed to better match your specific requirements.`;
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      // Note: Getting accurate positions in contentEditable is complex
      // This is a simplified version
      const range = selection.getRangeAt(0);
      setSelectionStart(range.startOffset);
      setSelectionEnd(range.endOffset);
    }
  };

  const quickActions = [
    { label: 'Add Introduction', prompt: 'Add an introduction section' },
    { label: 'Add Conclusion', prompt: 'Add a conclusion section' },
    { label: 'Add Summary', prompt: 'Add a summary section' },
    { label: 'Add Example', prompt: 'Add an example section' },
  ];

  const editActions = [
    { label: 'Make Concise', prompt: 'Make the selected text more concise' },
    { label: 'Add Details', prompt: 'Add more details to the selected text' },
    { label: 'Improve Clarity', prompt: 'Improve the clarity of the selected text' },
    { label: 'Make Professional', prompt: 'Make the selected text more professional' },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Main Editor */}
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="flex flex-col h-full bg-background">
            {/* Toolbar - Fixed */}
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
                    className="border-0 focus-visible:ring-0 font-medium text-lg px-2 bg-transparent text-foreground"
                    placeholder="Untitled Document"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSave} className="text-muted-foreground hover:text-foreground">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload} className="text-muted-foreground hover:text-foreground">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
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
              </div>
            </div>

            {/* Editor Content - Scrollable */}
            <div className="flex-1 bg-muted/30 overflow-y-auto custom-scrollbar">
              <div className="py-8 px-4">
                <div className="max-w-[816px] mx-auto bg-card shadow-xl min-h-[1056px] px-24 py-20 border border-border/50">
                  <Textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onSelect={handleTextSelection}
                    className="w-full min-h-[900px] border-0 focus-visible:ring-0 resize-none text-base leading-relaxed bg-transparent text-foreground"
                    placeholder="Start writing or ask AI to help you..."
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border" />

        {/* AI Assistant Panel */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="bg-background border-l border-border flex flex-col h-full">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-border bg-background/50 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-foreground">AI Assistant</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedText ? 'Selected text - Ask AI to edit it' : 'Ask AI to add content'}
              </p>
            </div>

            {/* Chat Messages - Scrollable */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {/* Instructions */}
                {chatMessages.length === 0 && (
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
                              onClick={() => {
                                setAiPrompt(action.prompt);
                                setTimeout(() => { void handleAIRequest(); }, 100);
                              }}
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
                              onClick={() => {
                                setAiPrompt(action.prompt);
                                setTimeout(() => { void handleAIRequest(); }, 100);
                              }}
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

                {/* Chat History */}
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

            {/* Input - Fixed */}
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
                  onClick={() => { void handleAIRequest(); }}
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

