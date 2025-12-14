"use client";
import { useState } from "react";
import { Document, UserPreferences } from "../page";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload, FileText, GraduationCap, CheckCircle2, Search, FolderOpen, X } from "lucide-react";

interface OnboardingScreenProps {
  documents: Document[];
  onComplete: (preferences: UserPreferences) => void;
  onUploadDocument: (file: File) => void;
}

export function OnboardingScreen({ documents, onComplete, onUploadDocument }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [mode, setMode] = useState<"teacher" | "study-buddy" | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories/folders
  const categories = ["all", ...new Set(documents.map(doc => doc.folder || "Uncategorized"))];

  // Filter documents based on search and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.folder === selectedCategory || (!doc.folder && selectedCategory === "Uncategorized");
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadDocument(file);
    }
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredDocuments.map(doc => doc.id);
    const allSelected = filteredIds.every(id => selectedDocuments.includes(id));
    
    if (allSelected) {
      // Deselect all filtered documents
      setSelectedDocuments(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered documents
      const newSelection = [...new Set([...selectedDocuments, ...filteredIds])];
      setSelectedDocuments(newSelection);
    }
  };

  const handleContinue = () => {
    if (step === 1 && selectedDocuments.length > 0) {
      setStep(2);
    } else if (step === 2 && grade && gender && fieldOfStudy) {
      setStep(3);
    } else if (step === 3 && mode) {
      onComplete({
        selectedDocuments,
        grade,
        gender,
        fieldOfStudy,
        mode,
      });
    }
  };

  const canContinue = () => {
    if (step === 1) return selectedDocuments.length > 0;
    if (step === 2) return grade && gender && fieldOfStudy;
    if (step === 3) return mode !== null;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-purple-600" />
            </div>
            <h1 className="text-white text-3xl">AI Learning Assistant</h1>
          </div>
          <p className="text-white/80">
            Let's set up your personalized learning experience
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  s < step
                    ? "bg-green-500 text-white"
                    : s === step
                    ? "bg-white text-purple-600"
                    : "bg-white/30 text-white/60"
                }`}
              >
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className="w-12 h-1 bg-white/30 rounded" />}
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1: Select Documents */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl mb-2">Select Your Study Materials</h2>
                <p className="text-gray-600">
                  Choose the documents you want to learn about
                </p>
              </div>

              {/* Upload Button */}
              <div>
                <label htmlFor="onboarding-upload">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-12 border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                    asChild
                  >
                    <span>
                      <Upload className="w-5 h-5" />
                      Upload New Document
                    </span>
                  </Button>
                </label>
                <input
                  id="onboarding-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Search and Filter */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by document name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === "all" 
                          ? "All Categories" 
                          : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  {selectedCategory !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                      className="h-10 px-3"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Search Results Info */}
                {(searchQuery || selectedCategory !== "all") && (
                  <div className="text-xs text-gray-600">
                    {filteredDocuments.length === 0 ? (
                      <span className="text-orange-600">No documents found</span>
                    ) : (
                      <span>
                        Showing {filteredDocuments.length} of {documents.length} document(s)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Document List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No documents found</p>
                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <>
                    {/* Select All Button */}
                    {filteredDocuments.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllFiltered}
                        className="w-full mb-2 h-9 text-xs"
                      >
                        {filteredDocuments.every(doc => selectedDocuments.includes(doc.id))
                          ? "Deselect All"
                          : "Select All"} ({filteredDocuments.length})
                      </Button>
                    )}
                    {filteredDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => toggleDocument(doc.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          selectedDocuments.includes(doc.id)
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedDocuments.includes(doc.id)
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedDocuments.includes(doc.id) && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="text-sm">{doc.name}</div>
                          {doc.folder && (
                            <div className="text-xs text-gray-500">{doc.folder}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {selectedDocuments.length > 0 && (
                <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                  {selectedDocuments.length} document(s) selected
                </div>
              )}
            </div>
          )}

          {/* Step 2: User Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl mb-2">Tell Us About Yourself</h2>
                <p className="text-gray-600">
                  This helps us personalize your learning experience
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="grade">Grade Level / Education Level</Label>
                  <Input
                    id="grade"
                    placeholder="e.g., 10th Grade, College Sophomore, Graduate"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender (Optional)</Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full mt-1.5 h-10 px-3 rounded-md border border-gray-200 bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="field">Field of Study</Label>
                  <Input
                    id="field"
                    placeholder="e.g., Mathematics, Biology, History, Computer Science"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Choose Mode */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl mb-2">Choose Your Learning Mode</h2>
                <p className="text-gray-600">
                  How would you like to learn today?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teacher Mode */}
                <button
                  onClick={() => setMode("teacher")}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    mode === "teacher"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">👨‍🏫</span>
                  </div>
                  <h3 className="text-lg mb-2">AI Teacher</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get structured lessons with a teaching agent who explains concepts
                    using a collaborative whiteboard
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>✓ Voice-guided lessons</div>
                    <div>✓ Interactive whiteboard</div>
                    <div>✓ Step-by-step explanations</div>
                  </div>
                </button>

                {/* Study Buddy Mode */}
                <button
                  onClick={() => setMode("study-buddy")}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    mode === "study-buddy"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <h3 className="text-lg mb-2">Study Buddy</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Work together with a friendly AI companion to create and follow
                    personalized study plans
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>✓ Collaborative learning</div>
                    <div>✓ Custom study plans</div>
                    <div>✓ Flexible pacing</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {step === 3 ? "Start Learning" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}