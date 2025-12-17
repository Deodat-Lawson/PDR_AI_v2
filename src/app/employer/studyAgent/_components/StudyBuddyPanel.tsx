"use client";
import { useState } from "react";
import type { Message, Document, StudyPlanItem } from "../page";
import { Button } from "./ui/button";
import { BookOpen, CheckCircle2, Circle, Plus, Edit2, Trash2 } from "lucide-react";
import { VoiceChat } from "./VoiceChat";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface StudyBuddyPanelProps {
  messages: Message[];
  studyPlan: StudyPlanItem[];
  documents: Document[];
  selectedDocument: Document | null;
  onSendMessage: (content: string) => void;
  onEndCall?: () => void;
  onPullUpMaterial: (docId: string) => void;
  onToggleStudyItem: (itemId: string) => void;
  onAddStudyItem: (item: Omit<StudyPlanItem, "id">) => void;
  onEditStudyItem: (itemId: string, updates: Partial<StudyPlanItem>) => void;
  onDeleteStudyItem: (itemId: string) => void;
}

export function StudyBuddyPanel({
  messages,
  studyPlan,
  documents,
  selectedDocument: _selectedDocument,
  onSendMessage,
  onEndCall,
  onPullUpMaterial,
  onToggleStudyItem,
  onAddStudyItem,
  onEditStudyItem,
  onDeleteStudyItem,
}: StudyBuddyPanelProps) {
  void _selectedDocument; // Unused but required by interface
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    materials: [] as string[],
  });

  const completedCount = studyPlan.filter((item) => item.completed).length;
  const totalCount = studyPlan.length;

  const handleStartCreate = () => {
    setIsCreating(true);
    setFormData({ title: "", description: "", materials: [] });
  };

  const handleStartEdit = (item: StudyPlanItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      materials: item.materials,
    });
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;

    if (editingId) {
      onEditStudyItem(editingId, formData);
      setEditingId(null);
    } else {
      onAddStudyItem({
        ...formData,
        completed: false,
      });
      setIsCreating(false);
    }
    setFormData({ title: "", description: "", materials: [] });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ title: "", description: "", materials: [] });
  };

  const toggleMaterial = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.includes(docId)
        ? prev.materials.filter((id) => id !== docId)
        : [...prev.materials, docId],
    }));
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Compact Voice Call Interface */}
      <VoiceChat 
        messages={messages} 
        onSendMessage={onSendMessage} 
        onEndCall={onEndCall} 
        isBuddy 
        documents={documents} 
      />

      {/* Study Plan Section */}
      <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg">Your Study Plan</h3>
              <Badge variant="secondary">
                {completedCount}/{totalCount}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Customize your learning journey
            </p>
            <Button
              onClick={handleStartCreate}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isCreating || editingId !== null}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Study Goal
            </Button>
          </div>

          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div>
                <Label htmlFor="title" className="text-xs">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Master Chapter 5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What do you want to achieve?"
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Related Materials (Optional)</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:bg-blue-100 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.materials.includes(doc.id)}
                        onChange={() => toggleMaterial(doc.id)}
                        className="rounded"
                      />
                      <span className="truncate">{doc.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!formData.title.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {editingId ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          )}

          {/* Study Plan Items */}
          <div className="space-y-3">
            {studyPlan.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition-all ${
                  item.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200 hover:border-blue-300"
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
                  <div className="flex-1 min-w-0">
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
                              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <BookOpen className="w-3 h-3" />
                              {doc.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(item)}
                      className="h-7 w-7 p-0"
                      disabled={isCreating || editingId !== null}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this study goal?")) {
                          onDeleteStudyItem(item.id);
                        }
                      }}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {studyPlan.length === 0 && !isCreating && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No study goals yet</p>
              <p className="text-xs mt-1">Create your first goal to get started!</p>
            </div>
          )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Ask your study buddy for help organizing your goals
            or breaking down complex topics!
          </p>
        </div>
      </div>
    </div>
  );
}
