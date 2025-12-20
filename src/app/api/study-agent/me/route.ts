import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
    studyAgentGoals,
    studyAgentMessages,
    studyAgentNotes,
    studyAgentPomodoroSettings,
    studyAgentPreferences,
    studyAgentProfile,
} from "~/server/db/schema";
import { resolveSessionForUser } from "~/server/study-agent/session";

// Helper to convert BigInt values to numbers for JSON serialization
function serializeBigInt<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "bigint") return Number(obj) as unknown as T;
    if (Array.isArray(obj)) return obj.map(serializeBigInt) as unknown as T;
    if (typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = serializeBigInt(value);
        }
        return result as T;
    }
    return obj;
}

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessionIdParam = new URL(request.url).searchParams.get("sessionId");
        const parsedSessionId = sessionIdParam ? Number(sessionIdParam) : undefined;
        const session = await resolveSessionForUser(
            userId,
            Number.isNaN(parsedSessionId) ? undefined : parsedSessionId
        );

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const sessionIdBigInt = BigInt(session.id);

        const [profile] = await db
            .select()
            .from(studyAgentProfile)
            .where(
                and(
                    eq(studyAgentProfile.userId, userId),
                    eq(studyAgentProfile.sessionId, sessionIdBigInt)
                )
            );

        const [preferences] = await db
            .select()
            .from(studyAgentPreferences)
            .where(
                and(
                    eq(studyAgentPreferences.userId, userId),
                    eq(studyAgentPreferences.sessionId, sessionIdBigInt)
                )
            );

        const goals = await db
            .select()
            .from(studyAgentGoals)
            .where(
                and(
                    eq(studyAgentGoals.userId, userId),
                    eq(studyAgentGoals.sessionId, sessionIdBigInt)
                )
            );

        const notes = await db
            .select()
            .from(studyAgentNotes)
            .where(
                and(
                    eq(studyAgentNotes.userId, userId),
                    eq(studyAgentNotes.sessionId, sessionIdBigInt)
                )
            );

        const [pomodoroSettings] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(
                and(
                    eq(studyAgentPomodoroSettings.userId, userId),
                    eq(studyAgentPomodoroSettings.sessionId, sessionIdBigInt)
                )
            );

        const messages = await db
            .select()
            .from(studyAgentMessages)
            .where(
                and(
                    eq(studyAgentMessages.userId, userId),
                    eq(studyAgentMessages.sessionId, sessionIdBigInt)
                )
            )
            .orderBy(asc(studyAgentMessages.createdAt));

        return NextResponse.json({
            session: serializeBigInt(session),
            profile: serializeBigInt(profile) ?? null,
            preferences: preferences?.preferences ?? null,
            goals: goals.map((goal) => serializeBigInt({ ...goal, id: goal.id.toString() })),
            notes: notes.map((note) => serializeBigInt({ ...note, id: note.id.toString() })),
            pomodoroSettings: serializeBigInt(pomodoroSettings) ?? null,
            messages: messages.map((msg) => serializeBigInt({ ...msg, id: msg.id.toString() })),
        });
    } catch (error) {
        console.error("Error loading study agent data", error);
        return NextResponse.json(
            { error: "Failed to load study agent data" },
            { status: 500 }
        );
    }
}