"use client";
import { useState } from "react";
import { Document } from "../page";
import { Search, Upload, ChevronDown, ChevronRight, FileText, Trash2, GraduationCap } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface SidebarProps {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (doc: Document) => void;
  onUploadDocument: (file: File) => void;
}

export function Sidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  onUploadDocument,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["test", "Culture of Engineering Profession"]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadDocument(file);
    }
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folder) ? prev.filter((f) => f !== folder) : [...prev, folder]
    );
  };

  // Group documents by folder
  const folders = documents.reduce((acc, doc) => {
    const folder = doc.folder || "Uncategorized";
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-purple-600">AI Teacher</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Upload Button */}
      <div className="p-4 border-b border-gray-200">
        <label htmlFor="file-upload">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            asChild
          >
            <span>
              <Upload className="w-4 h-4" />
              Upload Material
            </span>
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-2">
        {searchQuery ? (
          // Show filtered results
          <div className="space-y-1">
            {filteredDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors text-left ${
                  selectedDocument?.id === doc.id ? "bg-purple-50 text-purple-700" : "text-gray-700"
                }`}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{doc.name}</span>
              </button>
            ))}
          </div>
        ) : (
          // Show folder structure
          <div className="space-y-2">
            {Object.entries(folders).map(([folder, docs]) => {
              const isExpanded = expandedFolders.includes(folder);
              return (
                <div key={folder}>
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-gray-700">{folder}</span>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 space-y-1 mt-1">
                      {docs.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => onSelectDocument(doc)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors text-left group ${
                            selectedDocument?.id === doc.id
                              ? "bg-purple-50 text-purple-700"
                              : "text-gray-600"
                          }`}
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate flex-1">{doc.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
