import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../../server/db/index";
import { pdfChunks, document, users } from "../../../../server/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Study Agent Document Content API
 * Fetches document content/chunks for selected documents
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { documentIds?: unknown };
    const { documentIds } = body as { documentIds?: (string | number)[] };

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "documentIds array is required" },
        { status: 400 }
      );
    }

    // Get user info to verify company access
    const [userInfo] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const companyId = userInfo.companyId;

    // Convert string IDs to numbers
    const numericIds = documentIds.map((id: string | number) => Number(id));

    // Verify documents belong to user's company
    const docs = await db
      .select({
        id: document.id,
        title: document.title,
      })
      .from(document)
      .where(eq(document.companyId, companyId));

    const validDocIds = docs
      .map((d) => d.id)
      .filter((id) => numericIds.includes(id));

    if (validDocIds.length === 0) {
      return NextResponse.json(
        { error: "No valid documents found for user's company" },
        { status: 404 }
      );
    }

    // Fetch chunks for valid documents
    const chunks = await db
      .select({
        id: pdfChunks.id,
        documentId: pdfChunks.documentId,
        page: pdfChunks.page,
        content: pdfChunks.content,
      })
      .from(pdfChunks)
      .where(inArray(pdfChunks.documentId, validDocIds))
      .orderBy(pdfChunks.documentId, pdfChunks.page);

    // Group chunks by document
    const documentContent: Record<
      string,
      {
        title: string;
        chunks: Array<{ page: number; content: string }>;
      }
    > = {};

    for (const chunk of chunks) {
      const docId = chunk.documentId.toString();
      if (!documentContent[docId]) {
        const doc = docs.find((d) => d.id === chunk.documentId);
        documentContent[docId] = {
          title: doc?.title ?? `Document ${docId}`,
          chunks: [],
        };
      }
      documentContent[docId].chunks.push({
        page: chunk.page,
        content: chunk.content,
      });
    }

    // Create a summary text for each document (first 2000 chars of content)
    const documentSummaries: Array<{
      documentId: string;
      title: string;
      summary: string;
      totalPages: number;
    }> = [];

    for (const [docId, docData] of Object.entries(documentContent)) {
      const allContent = docData.chunks
        .map((c) => c.content)
        .join("\n\n")
        .substring(0, 2000);
      
      documentSummaries.push({
        documentId: docId,
        title: docData.title,
        summary: allContent,
        totalPages: Math.max(...docData.chunks.map((c) => c.page)),
      });
    }

    console.log(
      `📄 [StudyAgent Document Content API] Fetched content for ${documentSummaries.length} documents`
    );

    return NextResponse.json(
      {
        documents: documentSummaries,
        fullContent: documentContent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching document content:", error);
    return NextResponse.json(
      { error: "Failed to fetch document content" },
      { status: 500 }
    );
  }
}
