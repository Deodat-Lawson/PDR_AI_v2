
import { db, toRows } from "~/server/db/index";
import { sql } from "drizzle-orm";
import {
  BaseRetriever,
  type BaseRetrieverInput,
} from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import type { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager";
import type { EmbeddingsProvider, SearchScope } from "../types";

interface VectorRetrieverConfig extends BaseRetrieverInput {
  embeddings: EmbeddingsProvider;
  topK?: number;
  searchScope: SearchScope;
}

interface SingleDocConfig extends VectorRetrieverConfig {
  documentId: number;
  searchScope: "document";
}

interface CompanyConfig extends VectorRetrieverConfig {
  companyId: number;
  searchScope: "company";
}

interface MultiDocConfig extends VectorRetrieverConfig {
  documentIds: number[];
  searchScope: "multi-document";
}

type VectorRetrieverFields = SingleDocConfig | CompanyConfig | MultiDocConfig;

export class VectorRetriever extends BaseRetriever {
  lc_namespace = ["rag", "retrievers", "vector"];

  private embeddings: EmbeddingsProvider;
  private topK: number;
  private searchScope: SearchScope;
  private documentId?: number;
  private companyId?: number;
  private documentIds?: number[];

  constructor(fields: VectorRetrieverFields) {
    super(fields);
    this.embeddings = fields.embeddings;
    this.topK = fields.topK ?? 8;
    this.searchScope = fields.searchScope;

    if (fields.searchScope === "document") {
      this.documentId = fields.documentId;
    } else if (fields.searchScope === "company") {
      this.companyId = fields.companyId;
    } else if (fields.searchScope === "multi-document") {
      this.documentIds = fields.documentIds;
    }
  }

  async _getRelevantDocuments(
    query: string,
    _runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);
      const bracketedEmbedding = `[${queryEmbedding.join(",")}]`;

      let sqlQuery;

      if (this.searchScope === "document" && this.documentId !== undefined) {
        sqlQuery = sql`
          SELECT
            s.id,
            s.content,
            s.page_number as page,
            s.document_id,
            d.title as document_title,
            s.embedding <-> ${bracketedEmbedding}::vector(1536) AS distance
          FROM pdr_ai_v2_document_sections s
          JOIN pdr_ai_v2_document d ON s.document_id = d.id
          WHERE s.document_id = ${this.documentId}
          ORDER BY s.embedding <-> ${bracketedEmbedding}::vector(1536)
          LIMIT ${this.topK}
        `;
      } else if (this.searchScope === "company" && this.companyId !== undefined) {
        sqlQuery = sql`
          SELECT
            s.id,
            s.content,
            s.page_number as page,
            s.document_id,
            d.title as document_title,
            s.embedding <-> ${bracketedEmbedding}::vector(1536) AS distance
          FROM pdr_ai_v2_document_sections s
          JOIN pdr_ai_v2_document d ON s.document_id = d.id
          WHERE d.company_id = ${this.companyId.toString()}
          ORDER BY s.embedding <-> ${bracketedEmbedding}::vector(1536)
          LIMIT ${this.topK}
        `;
      } else if (this.searchScope === "multi-document" && this.documentIds?.length) {
        const docIdsArray = `{${this.documentIds.join(",")}}`;
        sqlQuery = sql`
          SELECT
            s.id,
            s.content,
            s.page_number as page,
            s.document_id,
            d.title as document_title,
            s.embedding <-> ${bracketedEmbedding}::vector(1536) AS distance
          FROM pdr_ai_v2_document_sections s
          JOIN pdr_ai_v2_document d ON s.document_id = d.id
          WHERE s.document_id = ANY(${docIdsArray}::int[])
          ORDER BY s.embedding <-> ${bracketedEmbedding}::vector(1536)
          LIMIT ${this.topK}
        `;
      } else {
        console.warn("[VectorRetriever] Invalid configuration, returning empty");
        return [];
      }

      type VectorRow = {
        id: number;
        content: string;
        page: number;
        document_id: number;
        document_title: string;
        distance: number;
      };
      const result = await db.execute<VectorRow>(sqlQuery);

      let rows = toRows<VectorRow>(result);

      // Fallback to legacy table if no results and search scope is document
      if (rows.length === 0 && this.searchScope === "document" && this.documentId !== undefined) {
        const legacyQuery = sql`
          SELECT
            s.id,
            s.content,
            s.page,
            s.document_id,
            d.title as document_title,
            s.embedding <-> ${bracketedEmbedding}::vector(1536) AS distance
          FROM pdr_ai_v2_pdf_chunks s
          JOIN pdr_ai_v2_document d ON s.document_id = d.id
          WHERE s.document_id = ${this.documentId}
          ORDER BY s.embedding <-> ${bracketedEmbedding}::vector(1536)
          LIMIT ${this.topK}
        `;
        const legacyResult = await db.execute<{
          id: number;
          content: string;
          page: number;
          document_id: number;
          document_title: string;
          distance: number;
        }>(legacyQuery);
        rows = toRows<VectorRow>(legacyResult).map(r => ({
          ...r,
          document_id: Number(r.document_id),
        }));
      } else if (rows.length === 0 && this.searchScope === "company" && this.companyId !== undefined) {
        const legacyQuery = sql`
          SELECT
            s.id,
            s.content,
            s.page,
            s.document_id,
            d.title as document_title,
            s.embedding <-> ${bracketedEmbedding}::vector(1536) AS distance
          FROM pdr_ai_v2_pdf_chunks s
          JOIN pdr_ai_v2_document d ON s.document_id = d.id
          WHERE d.company_id = ${this.companyId.toString()}
          ORDER BY s.embedding <-> ${bracketedEmbedding}::vector(1536)
          LIMIT ${this.topK}
        `;
        const legacyResult = await db.execute<{
          id: number;
          content: string;
          page: number;
          document_id: number;
          document_title: string;
          distance: number;
        }>(legacyQuery);
        rows = toRows<VectorRow>(legacyResult).map(r => ({
          ...r,
          document_id: Number(r.document_id),
        }));
      }

      const documents = rows.map((row: VectorRow) => {
        return new Document({
          pageContent: row.content,
          metadata: {
            chunkId: row.id,
            page: row.page,
            documentId: row.document_id,
            documentTitle: row.document_title,
            distance: row.distance,
            source: "vector_ann",
            searchScope: this.searchScope,
          },
        });
      });

      console.log(
        `✅ [VectorRetriever] Retrieved ${documents.length} chunks (scope: ${this.searchScope})`
      );

      return documents;
    } catch (error) {
      console.error("[VectorRetriever] Error:", error);
      return [];
    }
  }
}

/**
 * Factory functions for creating vector retrievers
 */
export function createDocumentVectorRetriever(
  documentId: number,
  embeddings: EmbeddingsProvider,
  topK = 8
): VectorRetriever {
  return new VectorRetriever({
    documentId,
    embeddings,
    topK,
    searchScope: "document",
  });
}

export function createCompanyVectorRetriever(
  companyId: number,
  embeddings: EmbeddingsProvider,
  topK = 10
): VectorRetriever {
  return new VectorRetriever({
    companyId,
    embeddings,
    topK,
    searchScope: "company",
  });
}

export function createMultiDocVectorRetriever(
  documentIds: number[],
  embeddings: EmbeddingsProvider,
  topK = 8
): VectorRetriever {
  return new VectorRetriever({
    documentIds,
    embeddings,
    topK,
    searchScope: "multi-document",
  });
}

