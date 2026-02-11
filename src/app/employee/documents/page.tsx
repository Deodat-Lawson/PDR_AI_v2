"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import styles from "../../../styles/Employee/DocumentViewer.module.css";

import LoadingDoc from "~/app/employee/documents/loading-doc";
import LoadingPage from "~/app/_components/loading";

import { DocumentsSidebar } from "./DocumentsSidebar";
import { DocumentContent } from "./DocumentContent";
import { type ViewMode } from "~/app/employee/documents/types";
import { useAIQuery } from "~/app/employer/documents/hooks/useAIQuery";
import type { QAHistoryEntry } from "~/app/employer/documents/types";

const SYSTEM_PROMPTS = {
    concise: "Concise & Direct",
    detailed: "Detailed & Comprehensive",
    academic: "Academic & Analytical",
    'bullet-points': "Organized Bullet Points"
} as const;

interface DocumentType {
    id: number;
    title: string;
    category: string;
    aiSummary?: string;
    url: string;
}

interface CategoryGroup {
    name: string;
    isOpen: boolean;
    documents: DocumentType[];
}



interface PredictiveAnalysisResponse {
  success: boolean;
  documentId: number;
  analysisType: string;
  summary: {
    totalMissingDocuments: number;
    highPriorityItems: number;
    totalRecommendations: number;
    totalSuggestedRelated: number;
    analysisTimestamp: string;
  };
  analysis: {
    missingDocuments: Array<{
      documentName: string;
      documentType: string;
      reason: string;
      page: number;
      priority: "high" | "medium" | "low";
      suggestedLinks?: Array<{
        title: string;
        link: string;
        snippet: string;
      }>;
      suggestedCompanyDocuments?: Array<{
        documentId: number;
        documentTitle: string;
        similarity: number;
        page: number;
        snippet: string;
      }>;
      resolvedIn?: {
        documentId: number;
        page: number;
        documentTitle?: string;
      };
    }>;
    recommendations: string[];
    suggestedRelatedDocuments?: Array<{
      title: string;
      link: string;
      snippet: string;
    }>;
    resolvedDocuments?: Array<{
      documentName: string;
      documentType: string;
      reason: string;
      originalPage: number;
      resolvedDocumentId: number;
      resolvedPage: number;
      resolvedDocumentTitle?: string;
      priority: "high" | "medium" | "low";
    }>;
  };
  metadata: {
    pagesAnalyzed: number;
    existingDocumentsChecked: number;
  };
  fromCache?: boolean;
}


const DocumentViewer: React.FC = () => {
    const router = useRouter();
    const { isLoaded, isSignedIn, userId } = useAuth();
    const [documents, setDocuments] = useState<DocumentType[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("document-only");
    const [aiQuestion, setAiQuestion] = useState("");
    const [aiAnswer, setAiAnswer] = useState("");
    const [aiError, setAiError] = useState("");
    const [referencePages, setReferencePages] = useState<number[]>([]);
    const [aiStyle, setAiStyle] = useState<string>("concise");
    const { sendQuery: sendAIQuery, loading: aiLoading } = useAIQuery();
    const [pdfPageNumber, setPdfPageNumber] = useState<number>(1);
    const [qaHistory] = useState<QAHistoryEntry[]>([]); // Q&A history not used for AI query
    const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysisResponse | null>(null);
    const [isPredictiveLoading, setIsPredictiveLoading] = useState(false);
    const [predictiveError, setPredictiveError] = useState("");



    useEffect(() => {
        // Wait for Clerk to fully load
        if (!isLoaded) return;

        // Use isSignedIn which is more reliable than checking userId directly
        if (!isSignedIn || !userId) {
            console.error("[Auth Debug] isLoaded:", isLoaded, "isSignedIn:", isSignedIn, "userId:", userId);
            router.push("/");
            return;
        }

        const checkEmployeeRole = async () => {
            try {
                const response = await fetch("/api/employeeAuth", {
                    method: "GET",
                });

                if (response.status === 300) {
                    router.push("/employee/pending-approval");
                    return;
                } else if (!response.ok) {
                    window.alert("Authentication failed! You are not an employee.");
                    router.push("/");
                    return;
                }
            } catch (error) {
                console.error("Error checking employee role:", error);
                window.alert("Authentication failed! You are not an employee.");
                router.push("/");
            } finally {
                setRoleLoading(false);
            }
        };

        checkEmployeeRole().catch(console.error);
    }, [isLoaded, isSignedIn, userId, router]);

    useEffect(() => {
        if (!userId) return;

        const fetchDocuments = async () => {
            try {
                const response = await fetch("/api/fetchDocument", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch documents");
                }

                const data: unknown = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("Invalid data format, expected an array.");
                }

                setDocuments(data);
            } catch (error) {
                console.error("Error fetching documents:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments().catch(console.error);
    }, [userId]);

    // Toggle category open/closed state
    const toggleCategory = (categoryName: string) => {
        setOpenCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryName)) {
                newSet.delete(categoryName);
            } else {
                newSet.add(categoryName);
            }
            return newSet;
        });
    };

    // 3. Build category groups
    const categories: CategoryGroup[] = Object.values(
        documents.reduce((acc: Record<string, CategoryGroup>, doc) => {
            // Filter by searchTerm in either "title" or "aiSummary"
            const inTitle = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
            const inSummary =
                doc.aiSummary?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;

            if (!inTitle && !inSummary) return acc;   

            acc[doc.category] ??= {
                name: doc.category,
                isOpen: openCategories.has(doc.category),
                documents: [],
            };
            
            acc[doc.category]!.documents.push(doc);
            return acc;
        }, {})
    );

    // 4. Handle AI Q&A
    const handleAiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setAiError("");
        setAiAnswer("");
        setReferencePages([]);

        if (!aiQuestion.trim()) return; // skip if empty question
        if (!selectedDoc?.id) {
            setAiError("Please select a document first");
            return;
        }

        try {
            const data = await sendAIQuery({
                documentId: selectedDoc.id,
                question: aiQuestion,
                style: aiStyle as 'concise' | 'detailed' | 'academic' | 'bullet-points',
            });

            if (!data) {
                throw new Error("Failed to get AI response");
            }

            setAiAnswer(data.summarizedAnswer ?? "");

            if (Array.isArray(data.recommendedPages)) {
                const uniquePages = Array.from(new Set(data.recommendedPages));
                setReferencePages(uniquePages);
            }

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Timeout error: Please try again later.";
            setAiError(errorMessage);
        }
    };

    const fetchPredictiveAnalysis = useCallback(async (documentId: number, forceRefresh = false) => {
        setPredictiveError("");
        setPredictiveAnalysis(null);
        setIsPredictiveLoading(true);

        try {
            const response = await fetch("/api/agents/predictive-document-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId,
                    analysisType: "general",
                    includeRelatedDocs: true,
                    forceRefresh,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as PredictiveAnalysisResponse;
            if (!data.success) {
                throw new Error("Analysis failed on server side");
            }

            if (data.analysis.resolvedDocuments) {
                data.analysis.resolvedDocuments = data.analysis.resolvedDocuments.map(res => ({
                    ...res,
                    resolvedDocumentTitle: res.resolvedDocumentTitle ?? documents.find(d => d.id === res.resolvedDocumentId)?.title ?? `Document ${res.resolvedDocumentId}`
                }));
            }
            if (data.analysis.missingDocuments.some(md => md.resolvedIn)) {
                data.analysis.missingDocuments = data.analysis.missingDocuments.map(md => {
                    if (md.resolvedIn) {
                        md.resolvedIn.documentTitle = md.resolvedIn.documentTitle ?? documents.find(d => d.id === md.resolvedIn!.documentId)?.title ?? `Document ${md.resolvedIn.documentId}`;
                    }
                    return md;
                });
            }

            setPredictiveAnalysis(data);
        } catch (error) {
            console.error("Error fetching predictive analysis:", error);
            setPredictiveError("Failed to perform predictive analysis. Please try again.");
        } finally {
            setIsPredictiveLoading(false);
        }
    }, [documents]);

    const handleSelectDocument = (docId: number, page: number) => {
        const targetDoc = documents.find(d => d.id === docId);
        if (targetDoc) {
            setSelectedDoc(targetDoc);
            setPdfPageNumber(page);
        }
    };




    // Q&A history fetching removed - not needed for AI query

    useEffect(() => {
        if (viewMode !== "predictive-analysis" || !selectedDoc?.id) return;
        fetchPredictiveAnalysis(selectedDoc.id, false).catch(console.error);
    }, [viewMode, selectedDoc, fetchPredictiveAnalysis]);

    if (roleLoading) {
        return <LoadingPage />;
    }
    if (loading) {
        return <LoadingDoc />;
    }

    return (
        <div className={styles.container}>
            <DocumentsSidebar
                categories={categories}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedDoc={selectedDoc}
                setSelectedDoc={(doc) => {
                    setSelectedDoc(doc);
                    setPdfPageNumber(1);
                    setAiAnswer("");
                    setReferencePages([]);
                }}
                viewMode={viewMode}
                setViewMode={setViewMode}
                toggleCategory={toggleCategory}
            />

            <main className={styles.mainContent}>
                <DocumentContent
                    selectedDoc={selectedDoc}
                    viewMode={viewMode}
                    aiQuestion={aiQuestion}
                    setAiQuestion={setAiQuestion}
                    aiAnswer={aiAnswer}
                    aiError={aiError}
                    aiLoading={aiLoading}
                    handleAiSearch={handleAiSearch}
                    referencePages={referencePages}
                    pdfPageNumber={pdfPageNumber}
                    setPdfPageNumber={setPdfPageNumber}
                    qaHistory={qaHistory}
                    aiStyle={aiStyle}
                    setAiStyle={setAiStyle}
                    styleOptions={SYSTEM_PROMPTS}
                    predictiveAnalysis={predictiveAnalysis}
                    predictiveLoading={isPredictiveLoading}
                    predictiveError={predictiveError}
                    onRefreshAnalysis={() => selectedDoc && fetchPredictiveAnalysis(selectedDoc.id, true)}
                    onSelectDocument={handleSelectDocument}
                />
            </main>
        </div>
    );
};

export default DocumentViewer;
