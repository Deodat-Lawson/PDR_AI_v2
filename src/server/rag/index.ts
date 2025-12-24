/**
 * Centralized RAG Module
 * 
 * This module provides a unified interface for Retrieval-Augmented Generation
 * across the application. It consolidates semantic search, keyword search,
 * and ensemble retrieval strategies.
 * 
 * Usage:
 * ```typescript
 * import { multiDocEnsembleSearch, formatResultsForPrompt } from "~/server/rag";
 * 
 * const results = await multiDocEnsembleSearch(query, { documentIds, topK: 8 });
 * const contextForAI = formatResultsForPrompt(results, documentTitles);
 * ```
 */

// Types
export type {
  SearchScope,
  RetrievalMethod,
  BaseSearchMetadata,
  SearchResult,
  DocumentSearchResult,
  CompanySearchResult,
  MultiDocSearchResult,
  EnsembleSearchOptions,
  DocumentSearchOptions,
  CompanySearchOptions,
  MultiDocSearchOptions,
  ChunkRow,
  ANNResult,
  ANNStrategy,
  ANNConfig,
  DocumentCluster,
  EmbeddingsProvider,
} from "./types";

// Retrievers
export {
  VectorRetriever,
  createDocumentVectorRetriever,
  createCompanyVectorRetriever,
  createMultiDocVectorRetriever,
  getDocumentChunks,
  getCompanyChunks,
  getMultiDocChunks,
  chunksToDocuments,
  createDocumentBM25Retriever,
  createCompanyBM25Retriever,
  createMultiDocBM25Retriever,
} from "./retrievers";

// Search
export {
  createOpenAIEmbeddings,
  createDocumentEnsembleRetriever,
  createCompanyEnsembleRetriever,
  createMultiDocEnsembleRetriever,
  documentEnsembleSearch,
  companyEnsembleSearch,
  multiDocEnsembleSearch,
} from "./search";

// Utilities
export {
  validateDocumentAccess,
  getUserCompanyId,
  formatResultsForPrompt,
  truncateText,
  cosineSimilarity,
  euclideanDistance,
} from "./utils";

