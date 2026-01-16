// Types for DocumentContent components

export interface DocumentType {
  id: number;
  title: string;
  category: string;
  aiSummary?: string;
  url: string;
}

export interface PredictiveAnalysisResponse {
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
    missingDocuments: Array<MissingDocument>;
    recommendations: string[];
    suggestedRelatedDocuments?: Array<SuggestedLink>;
    resolvedDocuments?: Array<ResolvedDocument>;
  };
  metadata: {
    pagesAnalyzed: number;
    existingDocumentsChecked: number;
  };
  fromCache?: boolean;
}

export interface MissingDocument {
  documentName: string;
  documentType: string;
  reason: string;
  page: number;
  priority: "high" | "medium" | "low";
  suggestedLinks?: Array<SuggestedLink>;
  suggestedCompanyDocuments?: Array<SuggestedCompanyDocument>;
  resolvedIn?: {
    documentId: number;
    page: number;
    documentTitle?: string;
  };
}

export interface SuggestedLink {
  title: string;
  link: string;
  snippet: string;
}

export interface SuggestedCompanyDocument {
  documentId: number;
  documentTitle: string;
  similarity: number;
  page: number;
  snippet: string;
}

export interface ResolvedDocument {
  documentName: string;
  documentType: string;
  reason: string;
  originalPage: number;
  resolvedDocumentId: number;
  resolvedPage: number;
  resolvedDocumentTitle?: string;
  priority: "high" | "medium" | "low";
}

export type AiPersona = 'general' | 'learning-coach' | 'financial-expert' | 'legal-expert' | 'math-reasoning';

