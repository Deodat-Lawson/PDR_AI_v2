/**
 * Note-Taking Tool
 * Create and manage study notes
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { NoteInput, StudyNote } from "../types";
import { db } from "~/server/db";
import { studyAgentNotes } from "~/server/db/schema";
import { resolveSessionForUser } from "~/server/study-agent/session";
import { and, eq } from "drizzle-orm";

const NoteSchema = z.object({
  action: z
    .enum(["create", "update", "delete"]) // TODO: add "search" or "list" actions
    .describe("The action to perform on notes"),
  userId: z.string().describe("The user ID"),
  noteId: z.string().optional().describe("Note ID for update/delete actions"), // TODO: add "get" action
  data: z
    .object({
      title: z.string().optional(),
      content: z.string().optional(),
      // format: z.enum(["text", "markdown", "bullet_points"]).optional(), // TODO: support markdown formatting
      tags: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Note data for create/update actions"),
});

/**
 * Manage study notes
 * Only supports:
 * - create
 * - update (used as "manage")
 * - delete
 */
export async function manageNotes(
  input: NoteInput & { userId: string; sessionId?: number | null }
): Promise<{
  success: boolean;
  note?: StudyNote;
  message: string;
}> {
  const now = new Date();

  const session = await resolveSessionForUser(input.userId, input.sessionId ?? undefined);
  if (!session) {
    return {
      success: false,
      message: "Unable to find a study session for this user",
    };
  }

  const mapRowToNote = (row: (typeof studyAgentNotes)["$inferSelect"]) => ({
    id: row.id.toString(),
    userId: row.userId,
    title: row.title ?? "",
    content: row.content ?? "",
    tags: row.tags ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
  });

  switch (input.action) {
    case "create": {
      if (!input.data?.title && !input.data?.content) {
        return {
          success: false,
          message: "Note title or content is required",
        };
      }

      const [inserted] = await db
        .insert(studyAgentNotes)
        .values({
          userId: input.userId,
          sessionId: session.id,
          title: input.data?.title ?? "Untitled Note",
          content: input.data?.content ?? "",
          tags: input.data?.tags ?? [],
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const newNote = mapRowToNote(inserted);
      console.log(`📝 [Notes] Created note: ${newNote.title}`);

      return {
        success: true,
        note: newNote,
        message: `Created note "${newNote.title}"${
          newNote.tags.length > 0 ? ` with tags: ${newNote.tags.join(", ")}` : ""
        }`,
      };
    }

    case "update": {
      if (!input.noteId) {
        return { success: false, message: "Note ID is required for update" };
      }

      const noteId = Number.parseInt(input.noteId, 10);
      if (Number.isNaN(noteId)) {
        return { success: false, message: "Note not found" };
      }

      const [existingNote] = await db
        .select()
        .from(studyAgentNotes)
        .where(
          and(
            eq(studyAgentNotes.id, noteId),
            eq(studyAgentNotes.userId, input.userId),
            eq(studyAgentNotes.sessionId, session.id)
          )
        );

      if (!existingNote) {
        return { success: false, message: "Note not found" };
      }

      const [updated] = await db
        .update(studyAgentNotes)
        .set({
          title: input.data?.title ?? existingNote.title,
          content: input.data?.content ?? existingNote.content,
          tags: input.data?.tags ?? existingNote.tags,
          updatedAt: now,
        })
        .where(
          and(
            eq(studyAgentNotes.id, noteId),
            eq(studyAgentNotes.userId, input.userId),
            eq(studyAgentNotes.sessionId, session.id)
          )
        )
        .returning();

      if (!updated) {
        return { success: false, message: "Unable to save note" };
      }

      const updatedNote = mapRowToNote(updated);
      console.log(`📝 [Notes] Updated note: ${updatedNote.title}`);

      return {
        success: true,
        note: updatedNote,
        message: `Updated note "${updatedNote.title}"`,
      };
    }

    // We intentionally do NOT support delete anymore.
    // Schema still includes it, so we return a clear error.
    case "delete":
      return {
        success: false,
        message: 'Action "delete" is not supported. Only "create" and "update" are available.',
      };

    default:
      return { success: false, message: "Unknown action" };
  }
}

/**
 * Note-Taking Tool for LangChain
 * Only forwards create/update relevant fields.
 */
export const noteTakingTool = tool(
  async (input): Promise<string> => {
    try {
      const result = await manageNotes({
        action: input.action,
        userId: input.userId,
        noteId: input.noteId,
        data: input.data,
      });

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  {
    name: "take_notes",
    description: `Create and manage study notes.
      Supported actions:
      - create: Create a new note
      - update: Update an existing note (manage)
      - delete: Delete an existing note

      Examples: "Take a note about photosynthesis", "Update my chemistry note with this new reaction"`,
    schema: NoteSchema, // unchanged
  }
);
