

import { db } from "~/server/db/index";
import { eq, inArray } from "drizzle-orm";
import { pdfChunks, document } from "~/server/db/schema";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { Document } from "@langchain/core/documents";
import type { ChunkRow, SearchScope } from "../types";

export async function getDocumentChunks(documentId: number): Promise<ChunkRow[]> {
  const rows = await db
    .select({
      id: pdfChunks.id,
      content: pdfChunks.content,
      page: pdfChunks.page,
      documentId: pdfChunks.documentId,
    })
    .from(pdfChunks)
    .where(eq(pdfChunks.documentId, BigInt(documentId)));

  return rows.map((r) => ({
    ...r,
    documentId: Number(r.documentId),
    documentTitle: undefined,
  }));
}

export async function getCompanyChunks(companyId: number): Promise<ChunkRow[]> {
  const rows = await db
    .select({
      id: pdfChunks.id,
      content: pdfChunks.content,
      page: pdfChunks.page,
      documentId: pdfChunks.documentId,
      documentTitle: document.title,
    })
    .from(pdfChunks)
    .innerJoin(document, eq(pdfChunks.documentId, document.id))
    .where(eq(document.companyId, BigInt(companyId)));

  return rows.map((r) => ({
    ...r,
    documentId: Number(r.documentId),
  }));
}

export async function getMultiDocChunks(documentIds: number[]): Promise<ChunkRow[]> {
  if (documentIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: pdfChunks.id,
      content: pdfChunks.content,
      page: pdfChunks.page,
      documentId: pdfChunks.documentId,
      documentTitle: document.title,
    })
    .from(pdfChunks)
    .innerJoin(document, eq(pdfChunks.documentId, document.id))
    .where(inArray(pdfChunks.documentId, documentIds.map(id => BigInt(id))));

  return rows.map((r) => ({
    ...r,
    documentId: Number(r.documentId),
  }));
}

export function chunksToDocuments(
  chunks: ChunkRow[],
  searchScope: SearchScope
): Document[] {
  return chunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk.content,
        metadata: {
          chunkId: chunk.id,
          page: chunk.page,
          documentId: chunk.documentId,
          documentTitle: chunk.documentTitle,
          source: "bm25",
          searchScope,
        },
      })
  );
}

export async function createDocumentBM25Retriever(
  documentId: number,
  topK = 8
): Promise<BM25Retriever> {
  const chunks = await getDocumentChunks(documentId);
  if (chunks.length === 0) {
    throw new Error(`No chunks found for document ${documentId}`);
  }

  const docs = chunksToDocuments(chunks, "document");
  return BM25Retriever.fromDocuments(docs, { k: topK });
}

export async function createCompanyBM25Retriever(
  companyId: number,
  topK = 10
): Promise<BM25Retriever> {
  const chunks = await getCompanyChunks(companyId);
  if (chunks.length === 0) {
    throw new Error(`No chunks found for company ${companyId}`);
  }

  const docs = chunksToDocuments(chunks, "company");
  return BM25Retriever.fromDocuments(docs, { k: topK });
}

export async function createMultiDocBM25Retriever(
  documentIds: number[],
  topK = 8
): Promise<BM25Retriever> {
  const chunks = await getMultiDocChunks(documentIds);
  if (chunks.length === 0) {
    throw new Error(`No chunks found for documents ${documentIds.join(", ")}`);
  }

  const docs = chunksToDocuments(chunks, "multi-document");
  return BM25Retriever.fromDocuments(docs, { k: topK });
}

