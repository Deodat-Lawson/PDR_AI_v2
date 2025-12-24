"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { AIChatbotSelector, type AIModel } from "./AIChatbotSelector";

interface AIMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  model?: string;
}

interface AIQueryChatProps {
  isBuddy?: boolean;
  isDark?: boolean;
}

export function AIQueryChat({ isBuddy = false, isDark = false }: AIQueryChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt4");
  const [, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callAIAssistantAPI = useCallback(async (userMessage: string, currentMessages: AIMessage[]) => {
    try {
      // Build conversation history string for context
      const conversationHistory = currentMessages
        .slice(-10)
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      const response = await fetch("/api/AIAssistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          searchScope: "company",
          aiModel: selectedModel,
          style: "concise",
          conversationHistory: conversationHistory || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(errorData.message ?? `Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        summarizedAnswer?: string;
        aiModel?: string;
      };
      
      if (!data.success) {
        throw new Error(data.message ?? "Failed to get AI response");
      }

      return {
        content: data.summarizedAnswer ?? "I apologize, but I couldn't generate a response.",
        model: data.aiModel ?? selectedModel,
      };
    } catch (err) {
      console.error("Error calling AI Assistant API:", err);
      throw err;
    }
  }, [selectedModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
      };
      
      const currentInput = input.trim();
      const currentMessages = [...messages, userMessage];
      
      setMessages(currentMessages);
      setInput("");
      setIsTyping(true);
      setError(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const aiResponse = await callAIAssistantAPI(currentInput, currentMessages);
        
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: aiResponse.content,
          timestamp: new Date(),
          model: aiResponse.model,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);
        
        // Add error message to chat
        const errorAiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
          model: selectedModel,
        };
        setMessages((prev) => [...prev, errorAiMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const themeColor = isBuddy ? "blue" : "purple";
  
  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header with Model Selector */}
      <div className={`p-4 border-b space-y-3 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${isDark ? 'text-yellow-400' : `text-${themeColor}-600`}`} />
          <div>
            <h4 className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Query Assistant</h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Separate from voice chat
            </p>
          </div>
        </div>
        <div>
          <label className={`text-xs mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            AI Model
          </label>
          <AIChatbotSelector 
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Sparkles className={`w-12 h-12 mx-auto mb-3 opacity-50 ${isDark ? 'text-gray-600' : ''}`} />
            <p className="text-sm">Ask me anything about your studies</p>
            <p className="text-xs mt-1">This is a separate AI assistant for quick queries</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === "user"
                      ? `${isBuddy ? 'bg-blue-600' : 'bg-purple-600'} text-white`
                      : isDark
                      ? 'bg-gray-800 text-gray-100 border border-gray-700'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-white/70"
                        : isDark
                        ? "text-gray-500"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-4 ${
        isDark 
          ? 'border-gray-700 bg-gray-800' 
          : isBuddy 
          ? 'bg-blue-50/50 border-gray-200' 
          : 'bg-purple-50/50 border-gray-200'
      }`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Shift+Enter for new line)"
            className={`min-h-[44px] max-h-[120px] resize-none ${
              isDark ? 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500' : ''
            }`}
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isTyping}
            className={`self-end h-11 px-4 ${
              isBuddy
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

