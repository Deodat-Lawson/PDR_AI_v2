import { and, asc, eq } from "drizzle-orm";

import { db } from "../db";
import { studyAgentSessions } from "../db/schema";

/**
 * Resolves a session for a user. Does NOT auto-create sessions.
 * Sessions should only be created after onboarding via POST /api/study-agent/me/session.
 * 
 * @param userId - The authenticated user's ID
 * @param sessionId - Optional specific session ID to look up
 * @returns The session if found, or null if no session exists
 */
export async function resolveSessionForUser(
    userId: string,
    sessionId?: number | null
) {
    if (sessionId) {
        // Look up specific session by ID
        const [session] = await db
            .select()
            .from(studyAgentSessions)
            .where(
                and(
                    eq(studyAgentSessions.id, sessionId),
                    eq(studyAgentSessions.userId, userId)
                )
            );

        return session ?? null;
    }

    // No sessionId provided - find the user's most recent session
    const [existing] = await db
        .select()
        .from(studyAgentSessions)
        .where(eq(studyAgentSessions.userId, userId))
        .orderBy(asc(studyAgentSessions.id));

    return existing ?? null;
}
