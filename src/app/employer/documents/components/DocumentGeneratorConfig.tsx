import { useState } from 'react';
import { ArrowLeft, Sparkles, FileText, Loader2 } from 'lucide-react';
import { Button } from "~/app/employer/documents/components/ui/button";
import { Input } from "~/app/employer/documents/components/ui/input";
import { Label } from "~/app/employer/documents/components/ui/label";
import { Textarea } from "~/app/employer/documents/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/app/employer/documents/components/ui/select';
import { Card } from "~/app/employer/documents/components/ui/card";

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
}

interface DocumentGeneratorConfigProps {
  template: DocumentTemplate;
  onBack: () => void;
  onGenerate: (config: DocumentConfig) => void;
}

export interface DocumentConfig {
  title: string;
  description: string;
  tone: string;
  length: string;
  audience: string;
  additionalDetails: string;
}

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'technical', label: 'Technical' },
  { value: 'creative', label: 'Creative' },
  { value: 'persuasive', label: 'Persuasive' },
];

const lengths = [
  { value: 'brief', label: 'Brief (1-2 pages)' },
  { value: 'medium', label: 'Medium (3-5 pages)' },
  { value: 'detailed', label: 'Detailed (6-10 pages)' },
  { value: 'comprehensive', label: 'Comprehensive (10+ pages)' },
];

const audiences = [
  { value: 'general', label: 'General Audience' },
  { value: 'technical', label: 'Technical Experts' },
  { value: 'executives', label: 'Executives/Leadership' },
  { value: 'students', label: 'Students/Academia' },
  { value: 'customers', label: 'Customers/Clients' },
  { value: 'team', label: 'Team Members' },
];

export function DocumentGeneratorConfig({ template, onBack, onGenerate }: DocumentGeneratorConfigProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [audience, setAudience] = useState('general');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!title.trim() || !description.trim()) return;

    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      onGenerate({
        title,
        description,
        tone,
        length,
        audience,
        additionalDetails,
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-background border-b border-border p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-muted-foreground hover:text-foreground hover:bg-muted">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2 text-foreground">Configure Your {template.name}</h1>
              <p className="text-muted-foreground">
                {template.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Template Preview Card */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-3 text-foreground">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold">Template Preview</h2>
            </div>
            
            {/* PDF-style Document Preview */}
            <div className="bg-muted p-6 rounded-lg border border-border">
              {/* Scrollable multi-page container */}
              <div className="max-h-[600px] overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Page 1 */}
                  <div className="bg-white dark:bg-gray-900 rounded shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                    {/* Document Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="h-5 bg-gray-900 dark:bg-gray-100 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
                    </div>
                    
                    {/* Document Body - Lines simulating text */}
                    <div className="p-6 space-y-4">
                      {/* Paragraph 1 */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                      </div>
                      
                      {/* Section Header */}
                      <div className="pt-2">
                        <div className="h-3 bg-gray-600 dark:bg-gray-400 rounded w-2/5 mb-2" />
                      </div>
                      
                      {/* Paragraph 2 */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                      </div>

                      {/* Section Header */}
                      <div className="pt-2">
                        <div className="h-3 bg-gray-600 dark:bg-gray-400 rounded w-2/5 mb-2" />
                      </div>
                      
                      {/* Paragraph 3 */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />
                      </div>
                      
                      {/* Bullet list simulation */}
                      <div className="space-y-2 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Category badge */}
                    <div className="absolute top-4 right-4">
                      <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded font-medium shadow-sm">
                        {template.category}
                      </span>
                    </div>
                    
                    {/* Page number */}
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400">Page 1</div>
                  </div>

                  {/* Page 2 */}
                  <div className="bg-white dark:bg-gray-900 rounded shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                    <div className="p-6 space-y-4">
                      {/* Section Header */}
                      <div className="h-3 bg-gray-600 dark:bg-gray-400 rounded w-2/5 mb-3" />
                      
                      {/* Paragraph */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                      </div>
                      
                      {/* Section Header */}
                      <div className="pt-2">
                        <div className="h-3 bg-gray-600 dark:bg-gray-400 rounded w-2/5 mb-2" />
                      </div>
                      
                      {/* Paragraph */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      </div>

                      {/* Table simulation */}
                      <div className="pt-3 space-y-2">
                        <div className="flex gap-2">
                          <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-1/3" />
                          <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-1/3" />
                          <div className="h-2 bg-gray-400 dark:bg-gray-500 rounded w-1/3" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Page number */}
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400">Page 2</div>
                  </div>

                  {/* Page 3 */}
                  <div className="bg-white dark:bg-gray-900 rounded shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                    <div className="p-6 space-y-4">
                      {/* Paragraph */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      </div>
                      
                      {/* Section Header */}
                      <div className="pt-2">
                        <div className="h-3 bg-gray-600 dark:bg-gray-400 rounded w-2/5 mb-2" />
                      </div>
                      
                      {/* Numbered list simulation */}
                      <div className="space-y-2 pl-4">
                        <div className="flex items-start gap-2">
                          <div className="text-xs text-gray-400 mt-0.5">1.</div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-xs text-gray-400 mt-0.5">2.</div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-xs text-gray-400 mt-0.5">3.</div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        </div>
                      </div>

                      {/* Section Header */}
                      <div className="pt-3">
                        <div className="h-3 bg-gray-600 dark:bg-gray-400 rounded w-1/3 mb-2" />
                      </div>
                      
                      {/* Paragraph */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                    </div>
                    
                    {/* Page number */}
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400">Page 3</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Document Details */}
          <Card className="p-6 bg-card border-border">
            <h2 className="font-semibold mb-4 text-foreground">Document Details</h2>
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">
                  Document Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Q4 2025 Marketing Strategy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">
                  What should this document cover? <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the main topics, goals, and key points you want to include..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about what you want the AI to generate. Include key topics, data points, or sections you need.
                </p>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-foreground">Writing Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Length */}
              <div className="space-y-2">
                <Label htmlFor="length" className="text-foreground">Document Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger id="length" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lengths.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audience */}
              <div className="space-y-2">
                <Label htmlFor="audience" className="text-foreground">Target Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger id="audience" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="additional" className="text-foreground">Additional Instructions (Optional)</Label>
                <Textarea
                  id="additional"
                  placeholder="Any specific requirements, sections to include, data to incorporate, or style preferences..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="min-h-[100px] bg-background border-border"
                />
              </div>
            </div>
          </Card>

          {/* AI Generation Tips */}
          <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Tips for Better Results</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be specific about what you want - the more detail, the better the output</li>
                  <li>• Include key points, statistics, or examples you want covered</li>
                  <li>• Mention any specific sections or structure you need</li>
                  <li>• You can always refine the document with AI after generation</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Bar - Fixed */}
      <div className="flex-shrink-0 bg-background border-t border-border p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="text-red-500">*</span> Required fields
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="border-border text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!title.trim() || !description.trim() || isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[160px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


