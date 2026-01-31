import { useState } from 'react';
import { Search, Plus, FileText, Clock, Sparkles, Brain } from 'lucide-react';
import { Input } from "~/app/employer/documents/components/ui/input";
import { Button } from "~/app/employer/documents/components/ui/button";
import { Card } from "~/app/employer/documents/components/ui/card";
import { cn } from "~/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "~/app/employer/documents/components/ui/tabs";

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
}

interface GeneratedDocument {
  id: string;
  title: string;
  template: string;
  lastEdited: string;
  content: string;
}

interface DocumentGeneratorHomeProps {
  onNewDocument: (template: DocumentTemplate) => void;
  onOpenDocument: (document: GeneratedDocument) => void;
  generatedDocuments: GeneratedDocument[];
}

const templates: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'General',
    description: 'Start from scratch with a clean slate',
    preview: '# Untitled Document\n\nStart writing your content here...'
  },
  {
    id: 'research',
    name: 'Research Paper',
    category: 'Academic',
    description: 'Structured academic research paper with abstract and citations',
    preview: '# Research Paper Title\n\n## Abstract\nBrief summary of your research...\n\n## Introduction\nBackground and context...'
  },
  {
    id: 'report',
    name: 'Business Report',
    category: 'Business',
    description: 'Professional business report with executive summary',
    preview: '# Business Report\n\n## Executive Summary\nKey findings and recommendations...\n\n## Analysis\nDetailed analysis...'
  },
  {
    id: 'proposal',
    name: 'Project Proposal',
    category: 'Business',
    description: 'Comprehensive project proposal with timeline and budget',
    preview: '# Project Proposal\n\n## Overview\nProject description...\n\n## Objectives\n- Goal 1\n- Goal 2'
  },
  {
    id: 'technical',
    name: 'Technical Documentation',
    category: 'Technical',
    description: 'Technical specs, API docs, and system architecture',
    preview: '# Technical Documentation\n\n## System Overview\nArchitecture details...\n\n## API Reference'
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    category: 'General',
    description: 'Structured meeting notes with action items',
    preview: '# Meeting Notes\n\n**Date:** TBD\n\n## Attendees\n- Participant 1\n\n## Discussion'
  },
  {
    id: 'whitepaper',
    name: 'Whitepaper',
    category: 'Marketing',
    description: 'In-depth marketing whitepaper with case studies',
    preview: '# Whitepaper Title\n\n## Executive Summary\nKey value proposition...\n\n## The Challenge'
  },
  {
    id: 'case-study',
    name: 'Case Study',
    category: 'Marketing',
    description: 'Customer success story and results',
    preview: '# Case Study\n\n## Client Overview\nCompany background...\n\n## Challenge\n## Solution\n## Results'
  },
  {
    id: 'guide',
    name: 'How-To Guide',
    category: 'Documentation',
    description: 'Step-by-step instructional guide',
    preview: '# How-To Guide\n\n## Introduction\nWhat you\'ll learn...\n\n## Step 1\nDetailed instructions...'
  },
  {
    id: 'policy',
    name: 'Policy Document',
    category: 'Legal',
    description: 'Company policy and procedures',
    preview: '# Policy Document\n\n## Purpose\nPolicy objectives...\n\n## Scope\n## Guidelines'
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'Marketing',
    description: 'Company or team newsletter',
    preview: '# Newsletter - [Month Year]\n\n## Highlights\n- Update 1\n- Update 2\n\n## Featured Story'
  },
  {
    id: 'sop',
    name: 'Standard Operating Procedure',
    category: 'Operations',
    description: 'Detailed process documentation',
    preview: '# Standard Operating Procedure\n\n## Purpose\n## Procedure\n1. Step 1\n2. Step 2'
  },
];

export function DocumentGeneratorHome({ onNewDocument, onOpenDocument, generatedDocuments }: DocumentGeneratorHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'new' | 'existing'>('new');

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredDocuments = generatedDocuments.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-background border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Document Generator</h1>
              </div>
              <p className="text-muted-foreground">
                Create AI-powered documents or continue editing existing ones
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'new' | 'existing')}>
            <TabsList className="bg-muted">
              <TabsTrigger value="new" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </TabsTrigger>
              <TabsTrigger value="existing" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <Clock className="w-4 h-4 mr-2" />
                My Documents ({generatedDocuments.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search Bar - Fixed */}
      <div className="flex-shrink-0 bg-background border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={viewMode === 'new' ? "Search templates..." : "Search your documents..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>
      </div>

      {/* Category Filter (only for templates) - Fixed */}
      {viewMode === 'new' && (
        <div className="flex-shrink-0 bg-background border-b border-border px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    selectedCategory === category ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {viewMode === 'new' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 border-border hover:border-purple-600 overflow-hidden flex flex-col bg-card"
                  onClick={() => onNewDocument(template)}
                >
                  {/* PDF-style Document Preview */}
                  <div className="bg-muted p-4 h-56 flex items-start justify-center relative overflow-hidden">
                    {/* Scrollable multi-page container */}
                    <div className="w-full h-full overflow-y-auto">
                      <div className="space-y-4 pb-2">
                        {/* Page 1 */}
                        <div className="bg-white dark:bg-gray-900 rounded shadow-lg border border-gray-200 dark:border-gray-700 relative p-3">
                          {/* Document Header */}
                          <div className="space-y-2 mb-3">
                            <div className="h-3 bg-gray-900 dark:bg-gray-100 rounded w-3/4" />
                            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/4" />
                          </div>
                          
                          {/* Document Body - Lines simulating text */}
                          <div className="space-y-1.5">
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                            
                            <div className="pt-2">
                              <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-2/5 mb-1.5" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            </div>

                            <div className="pt-2">
                              <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-2/5 mb-1.5" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            </div>
                          </div>
                          
                          {/* Page number */}
                          <div className="absolute bottom-2 right-3 text-[0.5rem] text-muted-foreground/50">1</div>
                        </div>

                        {/* Page 2 */}
                        <div className="bg-white dark:bg-gray-900 rounded shadow-lg border border-gray-200 dark:border-gray-700 relative p-3">
                          <div className="space-y-1.5">
                            <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-2/5 mb-2" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            
                            <div className="pt-2">
                              <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-2/5 mb-1.5" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            </div>
                          </div>
                          
                          {/* Page number */}
                          <div className="absolute bottom-2 right-3 text-[0.5rem] text-muted-foreground/50">2</div>
                        </div>

                        {/* Page 3 */}
                        <div className="bg-white dark:bg-gray-900 rounded shadow-lg border border-gray-200 dark:border-gray-700 relative p-3">
                          <div className="space-y-1.5">
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            
                            <div className="pt-2">
                              <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-2/5 mb-1.5" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                            </div>
                          </div>
                          
                          {/* Page number */}
                          <div className="absolute bottom-2 right-3 text-[0.5rem] text-muted-foreground/50">3</div>
                        </div>
                      </div>
                    </div>
                      
                    {/* Category badge overlay */}
                    <div className="absolute top-2 right-2">
                      <span className="text-[0.5rem] px-1.5 py-0.5 bg-purple-600 text-white rounded font-medium shadow-sm">
                        {template.category}
                      </span>
                    </div>
                    
                    {/* Page shadow effect */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-gray-200/50 dark:from-background/50 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium">
                        {template.category}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground">{template.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {template.description}
                    </p>
                  </div>

                  {/* Hover Action */}
                  <div className="px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div>
              {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      className="group cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 border-border hover:border-purple-600 p-5 bg-card"
                      onClick={() => onOpenDocument(doc)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate mb-1 text-foreground">{doc.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {doc.template} • Last edited {doc.lastEdited}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {doc.content.slice(0, 150)}...
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full group-hover:bg-purple-600 group-hover:text-white border-border"
                      >
                        Open Document
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">No documents yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AI-powered document to get started
                  </p>
                  <Button
                    onClick={() => setViewMode('new')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Document
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


