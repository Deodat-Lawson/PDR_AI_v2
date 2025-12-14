"use client";
import { useState, useRef, useEffect } from "react";
import { Message, Document, StudyPlanItem } from "../page";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";
import { VoiceChat } from "./VoiceChat";
import { Badge } from "./ui/badge";

interface TeacherPanelProps {
  messages: Message[];
  studyPlan: StudyPlanItem[];
  documents: Document[];
  onSendMessage: (content: string) => void;
  onEndCall?: () => void;
  onPullUpMaterial: (docId: string) => void;
  onToggleStudyItem: (itemId: string) => void;
}

export function TeacherPanel({
  messages,
  studyPlan,
  documents,
  onSendMessage,
  onEndCall,
  onPullUpMaterial,
  onToggleStudyItem,
}: TeacherPanelProps) {
  const completedCount = studyPlan.filter((item) => item.completed).length;
  const totalCount = studyPlan.length;

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Tabs */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 px-4 pt-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="chat">Teacher Call</TabsTrigger>
            <TabsTrigger value="plan">Study Plan</TabsTrigger>
          </TabsList>
        </div>

        {/* Voice Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col m-0 data-[state=active]:flex">
          <VoiceChat messages={messages} onSendMessage={onSendMessage} onEndCall={onEndCall} />
        </TabsContent>

        {/* Study Plan Tab */}
        <TabsContent value="plan" className="flex-1 overflow-y-auto p-4 m-0 data-[state=active]:block">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg">Your Study Plan</h3>
              <Badge variant="secondary">
                {completedCount}/{totalCount}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Your personalized learning path created by your AI teacher
            </p>
          </div>

          <div className="space-y-3">
            {studyPlan.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition-all ${
                  item.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleStudyItem(item.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4
                      className={`text-sm mb-1 ${
                        item.completed ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">{item.description}</p>
                    {item.materials.length > 0 && (
                      <div className="space-y-1">
                        {item.materials.map((materialId) => {
                          const doc = documents.find((d) => d.id === materialId);
                          if (!doc) return null;
                          return (
                            <button
                              key={materialId}
                              onClick={() => onPullUpMaterial(materialId)}
                              className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              <BookOpen className="w-3 h-3" />
                              {doc.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900">
              <strong>Tip:</strong> Click on any material to view it, or ask your teacher
              questions about your study plan in the chat.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}