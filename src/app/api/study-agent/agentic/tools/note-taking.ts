/**
 * Note-Taking Tool
 * Create and manage study notes
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { StudyNote, NoteInput } from "../types";

// In-memory note store (in production, this would be in the database)
const noteStore = new Map<string, StudyNote>();

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
  input: NoteInput & { userId: string }
): Promise<{
  success: boolean;
  note?: StudyNote;
  message: string;
}> {
  const now = new Date();

  switch (input.action) {
    case "create": {
      if (!input.data?.title && !input.data?.content) {
        return {
          success: false,
          message: "Note title or content is required",
        };
      }

      const newNote: StudyNote = {
        id: uuidv4(),
        userId: input.userId,
        title: input.data?.title ?? "Untitled Note",
        content: input.data?.content ?? "",
        // keep existing fields intact; only set the ones we can
        // (format/relatedDocuments/etc. are left to defaults if your type requires them)
        // If your StudyNote type requires these fields, keep them as-is from your original code:
        tags: input.data?.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };

      noteStore.set(newNote.id, newNote);
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

      const existingNote = noteStore.get(input.noteId);
      if (!existingNote) {
        return { success: false, message: "Note not found" };
      }

      const updatedNote: StudyNote = {
        ...existingNote,
        title: input.data?.title ?? existingNote.title,
        content: input.data?.content ?? existingNote.content,
        tags: input.data?.tags ?? existingNote.tags,
        // preserve the rest of the fields; only update updatedAt
        updatedAt: now,
      };

      noteStore.set(input.noteId, updatedNote);
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
