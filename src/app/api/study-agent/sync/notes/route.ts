/**
 * Notes Sync API
 * Syncs study notes between the agentic workflow and the UI
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { manageNotes } from "../../agentic/tools/note-taking";

export const runtime = "nodejs";

/**
 * GET - Get all notes for the user
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");
    const isFavorite = searchParams.get("favorite") === "true" ? true : undefined;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);

    let result;
    
    if (searchQuery) {
      // Search notes
      result = await manageNotes({
        action: "search",
        userId,
        searchQuery,
      });
    } else {
      // List all notes
      result = await manageNotes({
        action: "list",
        userId,
        filters: {
          isFavorite,
          tags,
          isArchived: false,
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      notes: result.note ? [result.note] : [],
      message: result.message,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Failed to get notes");
    console.error("Error getting notes:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Create, update, delete, or get a note
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      action?: "create" | "update" | "delete" | "get" | "summarize";
      noteId?: string;
      data?: {
        title?: string;
        content?: string;
        format?: "text" | "markdown" | "bullet_points";
        tags?: string[];
        relatedDocuments?: string[];
        relatedConcepts?: string[];
        isFavorite?: boolean;
        isArchived?: boolean;
      };
      searchQuery?: string;
      sessionId?: number;
    };
    const { action, noteId, data, searchQuery, sessionId } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const result = await manageNotes({
      action,
      userId,
      noteId,
      data,
      searchQuery,
      sessionId,
    });

    return NextResponse.json({
      success: result.success,
      note: result.note as unknown,
      message: result.message,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Failed to manage note");
    console.error("Error managing note:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

