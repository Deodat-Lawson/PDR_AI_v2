import { and, asc, eq } from "drizzle-orm";

import { db } from "../db";
import { studyAgentSessions } from "../db/schema";

export async function resolveSessionForUser(
    userId: string,
    sessionId?: number | null
) {
    if (sessionId) {
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

    const [existing] = await db
        .select()
        .from(studyAgentSessions)
        .where(eq(studyAgentSessions.userId, userId))
        .orderBy(asc(studyAgentSessions.id));

    if (existing) {
        return existing;
    }

    const [created] = await db
        .insert(studyAgentSessions)
        .values({ userId, name: "Default Session" })
        .returning();

    return created;
}
