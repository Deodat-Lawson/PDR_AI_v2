
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { OpenAIEmbeddings } from "@langchain/openai";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import {
  createDocumentVectorRetriever,
  createCompanyVectorRetriever,
  createMultiDocVectorRetriever,
} from "../retrievers/vector-retriever";
import {
  createDocumentBM25Retriever,
  createCompanyBM25Retriever,
  createMultiDocBM25Retriever,
  getDocumentChunks,
  getCompanyChunks,
  getMultiDocChunks,
  chunksToDocuments,
} from "../retrievers/bm25-retriever";
import type {
  SearchResult,
  DocumentSearchOptions,
  CompanySearchOptions,
  MultiDocSearchOptions,
  EmbeddingsProvider,
  SearchScope,
} from "../types";

const DEFAULT_WEIGHTS: [number, number] = [0.4, 0.6];
const DEFAULT_TOP_K = 8;

export function createOpenAIEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
  });
}

export async function createDocumentEnsembleRetriever(
  options: DocumentSearchOptions,
  embeddings?: EmbeddingsProvider
): Promise<EnsembleRetriever> {
  const { documentId, weights = DEFAULT_WEIGHTS, topK = DEFAULT_TOP_K } = options;
  const emb = embeddings ?? createOpenAIEmbeddings();

  const bm25Retriever = await createDocumentBM25Retriever(documentId, topK);
  const vectorRetriever = createDocumentVectorRetriever(documentId, emb, topK);

  return new EnsembleRetriever({
    retrievers: [bm25Retriever, vectorRetriever],
    weights,
  });
}

export async function createCompanyEnsembleRetriever(
  options: CompanySearchOptions,
  embeddings?: EmbeddingsProvider
): Promise<EnsembleRetriever> {
  const { companyId, weights = DEFAULT_WEIGHTS, topK = 10 } = options;
  const emb = embeddings ?? createOpenAIEmbeddings();

  const bm25Retriever = await createCompanyBM25Retriever(companyId, topK);
  const vectorRetriever = createCompanyVectorRetriever(companyId, emb, topK);

  return new EnsembleRetriever({
    retrievers: [bm25Retriever, vectorRetriever],
    weights,
  });
}

export async function createMultiDocEnsembleRetriever(
  options: MultiDocSearchOptions,
  embeddings?: EmbeddingsProvider
): Promise<EnsembleRetriever> {
  const { documentIds, weights = DEFAULT_WEIGHTS, topK = DEFAULT_TOP_K } = options;
  const emb = embeddings ?? createOpenAIEmbeddings();

  const bm25Retriever = await createMultiDocBM25Retriever(documentIds, topK);
  const vectorRetriever = createMultiDocVectorRetriever(documentIds, emb, topK);

  return new EnsembleRetriever({
    retrievers: [bm25Retriever, vectorRetriever],
    weights,
  });
}

export async function documentEnsembleSearch(
  query: string,
  options: DocumentSearchOptions,
  embeddings?: EmbeddingsProvider
): Promise<SearchResult[]> {
  const { documentId, topK = DEFAULT_TOP_K } = options;

  console.log(
    `🔍 [EnsembleSearch] Searching document ${documentId} for: "${query.substring(0, 50)}..."`
  );

  try {
    const retriever = await createDocumentEnsembleRetriever(options, embeddings);
    const results = await retriever.getRelevantDocuments(query);

    console.log(`✅ [EnsembleSearch] Found ${results.length} results for document ${documentId}`);

    return results.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        retrievalMethod: "ensemble_rrf",
        timestamp: new Date().toISOString(),
        searchScope: "document" as const,
      },
    }));
  } catch (error) {
    console.error("[EnsembleSearch] Document search error:", error);
    return fallbackBM25Search(query, "document", { documentId }, topK);
  }
}

export async function companyEnsembleSearch(
  query: string,
  options: CompanySearchOptions,
  embeddings?: EmbeddingsProvider
): Promise<SearchResult[]> {
  const { companyId, topK = 10 } = options;

  console.log(
    `🔍 [EnsembleSearch] Searching company ${companyId} for: "${query.substring(0, 50)}..."`
  );

  try {
    const retriever = await createCompanyEnsembleRetriever(options, embeddings);
    const results = await retriever.getRelevantDocuments(query);

    console.log(`✅ [EnsembleSearch] Found ${results.length} results for company ${companyId}`);

    return results.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        retrievalMethod: "ensemble_rrf",
        timestamp: new Date().toISOString(),
        searchScope: "company" as const,
      },
    }));
  } catch (error) {
    console.error("[EnsembleSearch] Company search error:", error);
    return fallbackBM25Search(query, "company", { companyId }, topK);
  }
}

export async function multiDocEnsembleSearch(
  query: string,
  options: MultiDocSearchOptions,
  embeddings?: EmbeddingsProvider
): Promise<SearchResult[]> {
  const { documentIds, topK = DEFAULT_TOP_K } = options;

  if (documentIds.length === 0) {
    console.log("[EnsembleSearch] No documents provided, returning empty");
    return [];
  }

  console.log(
    `🔍 [EnsembleSearch] Searching ${documentIds.length} documents for: "${query.substring(0, 50)}..."`
  );

  try {
    const retriever = await createMultiDocEnsembleRetriever(options, embeddings);
    const results = await retriever.getRelevantDocuments(query);

    console.log(
      `✅ [EnsembleSearch] Found ${results.length} results from ${documentIds.length} documents`
    );

    return results.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        retrievalMethod: "ensemble_rrf",
        timestamp: new Date().toISOString(),
        searchScope: "multi-document" as const,
      },
    }));
  } catch (error) {
    console.error("[EnsembleSearch] Multi-doc search error:", error);
    return fallbackBM25Search(query, "multi-document", { documentIds }, topK);
  }
}

async function fallbackBM25Search(
  query: string,
  scope: SearchScope,
  ids: { documentId?: number; companyId?: number; documentIds?: number[] },
  topK: number
): Promise<SearchResult[]> {
  console.warn(`[EnsembleSearch] Falling back to BM25-only search for ${scope}`);

  try {
    let chunks;
    if (scope === "document" && ids.documentId !== undefined) {
      chunks = await getDocumentChunks(ids.documentId);
    } else if (scope === "company" && ids.companyId !== undefined) {
      chunks = await getCompanyChunks(ids.companyId);
    } else if (scope === "multi-document" && ids.documentIds?.length) {
      chunks = await getMultiDocChunks(ids.documentIds);
    } else {
      return [];
    }

    if (chunks.length === 0) {
      return [];
    }

    const docs = chunksToDocuments(chunks, scope);
    const retriever = BM25Retriever.fromDocuments(docs, { k: topK });
    const results = await retriever.getRelevantDocuments(query);

    return results.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        retrievalMethod: "bm25_fallback",
        timestamp: new Date().toISOString(),
        searchScope: scope,
      },
    }));
  } catch (fallbackError) {
    console.error("[EnsembleSearch] Fallback search error:", fallbackError);
    return [];
  }
}
