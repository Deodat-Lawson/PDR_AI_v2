import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../../server/db/index";
import { document, users } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Study Agent Documents API
 * Fetches documents from the database for the authenticated user's company
 */
export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info to find company
    const [userInfo] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const companyId = userInfo.companyId;

    // Fetch documents for the company
    const docs = await db
      .select({
        id: document.id,
        title: document.title,
        category: document.category,
        url: document.url,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      })
      .from(document)
      .where(eq(document.companyId, companyId))
      .orderBy(document.createdAt);

    // Transform to match study agent Document interface
    const studyAgentDocs = docs.map((doc) => ({
      id: doc.id.toString(),
      name: doc.title,
      type: "pdf" as const,
      url: doc.url,
      folder: doc.category,
      uploadedAt: doc.createdAt || new Date(),
    }));

    console.log(`📚 [StudyAgent Documents API] Fetched ${studyAgentDocs.length} documents for company ${companyId}`);

    return NextResponse.json(studyAgentDocs, { status: 200 });
  } catch (error) {
    console.error("Error fetching documents for study agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
