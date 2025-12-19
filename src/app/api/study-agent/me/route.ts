import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
    studyAgentGoals,
    studyAgentNotes,
    studyAgentPomodoroSettings,
    studyAgentPreferences,
    studyAgentProfile,
} from "~/server/db/schema";
import { resolveSessionForUser } from "~/server/study-agent/session";

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

        const [profile] = await db
            .select()
            .from(studyAgentProfile)
            .where(
                and(
                    eq(studyAgentProfile.userId, userId),
                    eq(studyAgentProfile.sessionId, session.id)
                )
            );

        const [preferences] = await db
            .select()
            .from(studyAgentPreferences)
            .where(
                and(
                    eq(studyAgentPreferences.userId, userId),
                    eq(studyAgentPreferences.sessionId, session.id)
                )
            );

        const goals = await db
            .select()
            .from(studyAgentGoals)
            .where(
                and(
                    eq(studyAgentGoals.userId, userId),
                    eq(studyAgentGoals.sessionId, session.id)
                )
            );

        const notes = await db
            .select()
            .from(studyAgentNotes)
            .where(
                and(
                    eq(studyAgentNotes.userId, userId),
                    eq(studyAgentNotes.sessionId, session.id)
                )
            );

        const [pomodoroSettings] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(
                and(
                    eq(studyAgentPomodoroSettings.userId, userId),
                    eq(studyAgentPomodoroSettings.sessionId, session.id)
                )
            );

        return NextResponse.json({
            session,
            profile: profile ?? null,
            preferences: preferences?.preferences ?? null,
            goals: goals.map((goal) => ({ ...goal, id: goal.id.toString() })),
            notes: notes.map((note) => ({ ...note, id: note.id.toString() })),
            pomodoroSettings: pomodoroSettings ?? null,
        });
    } catch (error) {
        console.error("Error loading study agent data", error);
        return NextResponse.json(
            { error: "Failed to load study agent data" },
            { status: 500 }
        );
    }
}