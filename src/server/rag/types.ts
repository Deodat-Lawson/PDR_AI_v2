/**
 * Centralized RAG Types
 * Common types and interfaces for all RAG operations across the application
 */

/**
 * Search scope determines the context of the search
 */
export type SearchScope = "document" | "company" | "multi-document";

/**
 * Retrieval method tracks which algorithm retrieved the result
 */
export type RetrievalMethod =
  | "vector_ann"
  | "bm25"
  | "ensemble_rrf"
  | "bm25_fallback"
  | "ann_hnsw"
  | "ann_ivf"
  | "ann_hybrid"
  | "ann_prefiltered";

/**
 * Base metadata for all search results
 */
export interface BaseSearchMetadata {
  chunkId?: number;
  page?: number;
  documentId?: number;
  documentTitle?: string;
  distance?: number;
  confidence?: number;
  source?: string;
  searchScope: SearchScope;
  retrievalMethod?: RetrievalMethod;
  timestamp?: string;
}

/**
 * Generic search result with content and metadata
 */
export interface SearchResult<T extends BaseSearchMetadata = BaseSearchMetadata> {
  pageContent: string;
  metadata: T;
}

/**
 * Document-scoped search result
 */
export interface DocumentSearchResult extends SearchResult {
  metadata: BaseSearchMetadata & {
    searchScope: "document";
  };
}

/**
 * Company-scoped search result
 */
export interface CompanySearchResult extends SearchResult {
  metadata: BaseSearchMetadata & {
    searchScope: "company";
  };
}

/**
 * Multi-document search result
 */
export interface MultiDocSearchResult extends SearchResult {
  metadata: BaseSearchMetadata & {
    searchScope: "multi-document";
  };
}

/**
 * Options for ensemble search combining multiple retrieval methods
 */
export interface EnsembleSearchOptions {
  /** Weight distribution between retrievers [BM25, Vector] - should sum to 1.0 */
  weights?: [number, number];
  /** Number of results to return */
  topK?: number;
  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;
}

/**
 * Options for single document search
 */
export interface DocumentSearchOptions extends EnsembleSearchOptions {
  documentId: number;
}

/**
 * Options for company-wide search
 */
export interface CompanySearchOptions extends EnsembleSearchOptions {
  companyId: number;
}

/**
 * Options for multi-document search
 */
export interface MultiDocSearchOptions extends EnsembleSearchOptions {
  documentIds: number[];
}

/**
 * Raw chunk data from database
 */
export interface ChunkRow {
  id: number;
  content: string;
  page: number;
  documentId: number;
  documentTitle?: string;
  embedding?: number[];
}

/**
 * ANN (Approximate Nearest Neighbor) search result
 */
export interface ANNResult {
  id: number;
  content: string;
  page: number;
  documentId: number;
  distance: number;
  confidence: number;
}

/**
 * ANN search strategy options
 */
export type ANNStrategy = "hnsw" | "ivf" | "hybrid" | "prefiltered";

/**
 * Configuration for ANN optimizer
 */
export interface ANNConfig {
  strategy: ANNStrategy;
  /** Number of probes for IVF search */
  probeCount?: number;
  /** ef parameter for HNSW search */
  efSearch?: number;
  /** Maximum candidates to consider */
  maxCandidates?: number;
  /** Threshold for prefiltering documents */
  prefilterThreshold?: number;
}

/**
 * Document cluster for IVF-style search optimization
 */
export interface DocumentCluster {
  documentId: number;
  centroid: number[];
  chunkIds: number[];
  avgDistance: number;
  lastUpdated: Date;
}

/**
 * Embeddings provider interface
 */
export interface EmbeddingsProvider {
  embedQuery(query: string): Promise<number[]>;
  embedDocuments?(documents: string[]): Promise<number[][]>;
}

