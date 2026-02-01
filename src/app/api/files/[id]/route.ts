/**
 * File Serving API Route
 * Retrieves and serves files stored in the database
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { fileUploads } from "~/server/db/schema";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id, 10);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    // Fetch file from database
    const [file] = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, fileId));

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Decode base64 data back to binary
    const binaryData = Buffer.from(file.fileData, "base64");

    // Return file with appropriate headers
    return new NextResponse(binaryData, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": binaryData.length.toString(),
        "Content-Disposition": `inline; filename="${file.filename}"`,
        "Cache-Control": "private, max-age=31536000", // Cache for 1 year (immutable content)
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      {
        error: "Failed to serve file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

