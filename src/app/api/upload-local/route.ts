/**
 * Local File Upload API Route
 * Stores uploaded files in the database when UploadThing is disabled
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { fileUploads } from "~/server/db/schema";

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB to match UploadThing config
const ALLOWED_MIME_TYPES = ["application/pdf"];

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Store in database
    const [uploadedFile] = await db.insert(fileUploads).values({
      userId,
      filename: file.name,
      mimeType: file.type,
      fileData: base64Data,
      fileSize: file.size,
    }).returning({
      id: fileUploads.id,
      filename: fileUploads.filename,
    });

    if (!uploadedFile) {
      return NextResponse.json(
        { error: "Failed to store file" },
        { status: 500 }
      );
    }

    // Return URL that can be used to fetch the file
    const fileUrl = `/api/files/${uploadedFile.id}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      name: uploadedFile.filename,
      id: uploadedFile.id,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

