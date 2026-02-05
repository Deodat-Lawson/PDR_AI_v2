"use client";

import { useState } from "react";
import {
    ListTree,
    ChevronRight,
    ChevronDown,
    Sparkles,
    Plus,
    Trash2,
    Edit2,
    Loader2,
    FileText,
    RefreshCw,
} from "lucide-react";
import { Button } from "~/app/employer/documents/components/ui/button";
import { Input } from "~/app/employer/documents/components/ui/input";
import { Textarea } from "~/app/employer/documents/components/ui/textarea";
import { ScrollArea } from "~/app/employer/documents/components/ui/scroll-area";
import { cn } from "~/lib/utils";

// Outline item structure
export interface OutlineItem {
    id: string;
    title: string;
    level: number;
    description?: string;
    children?: OutlineItem[];
    isExpanded?: boolean;
}

interface OutlinePanelProps {
    outline: OutlineItem[];
    documentTitle: string;
    documentDescription: string;
    onOutlineChange: (outline: OutlineItem[]) => void;
    onInsertSection: (title: string, level: number) => void;
    onClose: () => void;
}

export function OutlinePanel({
    outline,
    documentTitle,
    documentDescription,
    onOutlineChange,
    onInsertSection,
    onClose,
}: OutlinePanelProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState(documentTitle || "");
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const generateOutline = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        try {
            const response = await fetch("/api/document-generator/outline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate",
                    topic,
                    description: documentDescription,
                    options: {
                        depth: 3,
                        sections: 6,
                    },
                }),
            });

            const data = await response.json() as { success: boolean; outline?: OutlineItem[] };
            if (data.success && data.outline) {
                onOutlineChange(data.outline);
                // Expand all top-level items
                const topLevelIds = new Set(data.outline.map((item) => item.id));
                setExpandedItems(topLevelIds);
            }
        } catch (error) {
            console.error("Error generating outline:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    const startEdit = (item: OutlineItem) => {
        setEditingId(item.id);
        setEditValue(item.title);
    };

    const saveEdit = (item: OutlineItem, items: OutlineItem[]): OutlineItem[] => {
        return items.map((i) => {
            if (i.id === item.id) {
                return { ...i, title: editValue };
            }
            if (i.children) {
                return { ...i, children: saveEdit(item, i.children) };
            }
            return i;
        });
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        const item = findItem(outline, editingId);
        if (item) {
            onOutlineChange(saveEdit(item, outline));
        }
        setEditingId(null);
        setEditValue("");
    };

    const findItem = (items: OutlineItem[], id: string): OutlineItem | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findItem(item.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const deleteItem = (items: OutlineItem[], id: string): OutlineItem[] => {
        return items
            .filter((item) => item.id !== id)
            .map((item) => ({
                ...item,
                children: item.children ? deleteItem(item.children, id) : undefined,
            }));
    };

    const handleDelete = (id: string) => {
        onOutlineChange(deleteItem(outline, id));
    };

    const addChild = (parentId: string) => {
        const newItem: OutlineItem = {
            id: `${parentId}.${Date.now()}`,
            title: "New Section",
            level: 2,
        };

        const addToParent = (items: OutlineItem[]): OutlineItem[] => {
            return items.map((item) => {
                if (item.id === parentId) {
                    return {
                        ...item,
                        children: [...(item.children ?? []), newItem],
                    };
                }
                if (item.children) {
                    return { ...item, children: addToParent(item.children) };
                }
                return item;
            });
        };

        onOutlineChange(addToParent(outline));
        setExpandedItems(new Set([...expandedItems, parentId]));
    };

    const addTopLevel = () => {
        const newItem: OutlineItem = {
            id: Date.now().toString(),
            title: "New Section",
            level: 1,
        };
        onOutlineChange([...outline, newItem]);
    };

    const renderOutlineItem = (item: OutlineItem, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.has(item.id);
        const isEditing = editingId === item.id;

        return (
            <div key={item.id} className="select-none">
                <div
                    className={cn(
                        "flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-muted/50 group",
                        depth > 0 && "ml-4"
                    )}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {/* Expand/Collapse */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => toggleExpand(item.id)}
                    >
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )
                        ) : (
                            <div className="w-3 h-3" />
                        )}
                    </Button>

                    {/* Title */}
                    {isEditing ? (
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                            className="h-6 text-sm flex-1"
                            autoFocus
                        />
                    ) : (
                        <span
                            className={cn(
                                "flex-1 text-sm cursor-pointer truncate",
                                item.level === 1 && "font-medium"
                            )}
                            onClick={() => onInsertSection(item.title, item.level)}
                        >
                            {item.title}
                        </span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => startEdit(item)}
                        >
                            <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => addChild(item.id)}
                        >
                            <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {item.children!.map((child) => renderOutlineItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <ListTree className="w-4 h-4" />
                        Outline
                    </h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>

                {/* Generate Controls */}
                <div className="space-y-2">
                    <Textarea
                        placeholder="Document topic or description..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="min-h-[60px] text-sm"
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={generateOutline}
                            disabled={isGenerating || !topic.trim()}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Outline
                                </>
                            )}
                        </Button>
                        {outline.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={generateOutline}
                                disabled={isGenerating}
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Outline Tree */}
            <ScrollArea className="flex-1">
                <div className="p-4">
                    {outline.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">No outline yet</p>
                            <p className="text-xs mt-1">Generate one or add sections manually</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {outline.map((item) => renderOutlineItem(item))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addTopLevel}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Click a section title to insert it into your document
                </p>
            </div>
        </div>
    );
}
