import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentPomodoroSettings } from "~/server/db/schema";
import { resolveSessionForUser } from "~/server/study-agent/session";

function parseSessionId(request: Request) {
    const sessionIdParam = new URL(request.url).searchParams.get("sessionId");
    const parsedSessionId = sessionIdParam ? Number(sessionIdParam) : undefined;
    return Number.isNaN(parsedSessionId) ? undefined : parsedSessionId;
}

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = await resolveSessionForUser(userId, parseSessionId(request));
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const [settings] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(
                and(
                    eq(studyAgentPomodoroSettings.userId, userId),
                    eq(studyAgentPomodoroSettings.sessionId, session.id)
                )
            );

        return NextResponse.json({ pomodoroSettings: settings ?? null, session });
    } catch (error) {
        console.error("Error fetching pomodoro settings", error);
        return NextResponse.json(
            { error: "Failed to load pomodoro settings" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const session = await resolveSessionForUser(
            userId,
            body.sessionId ?? parseSessionId(request)
        );

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const payload = {
            focusMinutes: body.focusMinutes ?? 25,
            shortBreakMinutes: body.shortBreakMinutes ?? 5,
            longBreakMinutes: body.longBreakMinutes ?? 15,
            sessionsBeforeLongBreak: body.sessionsBeforeLongBreak ?? 4,
            autoStartBreaks: Boolean(body.autoStartBreaks),
            autoStartPomodoros: Boolean(body.autoStartPomodoros),
        };

        const [existing] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(
                and(
                    eq(studyAgentPomodoroSettings.userId, userId),
                    eq(studyAgentPomodoroSettings.sessionId, session.id)
                )
            );

        if (existing) {
            const [updated] = await db
                .update(studyAgentPomodoroSettings)
                .set(payload)
                .where(
                    and(
                        eq(studyAgentPomodoroSettings.userId, userId),
                        eq(studyAgentPomodoroSettings.sessionId, session.id)
                    )
                )
                .returning();

            return NextResponse.json({ pomodoroSettings: updated, session });
        }

        const [created] = await db
            .insert(studyAgentPomodoroSettings)
            .values({ ...payload, userId, sessionId: session.id })
            .returning();

        return NextResponse.json({ pomodoroSettings: created, session }, { status: 201 });
    } catch (error) {
        console.error("Error saving pomodoro settings", error);
        return NextResponse.json(
            { error: "Failed to save pomodoro settings" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const session = await resolveSessionForUser(userId, parseSessionId(request));
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        await db
            .delete(studyAgentPomodoroSettings)
            .where(
                and(
                    eq(studyAgentPomodoroSettings.userId, userId),
                    eq(studyAgentPomodoroSettings.sessionId, session.id)
                )
            );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting pomodoro settings", error);
        return NextResponse.json(
            { error: "Failed to delete pomodoro settings" },
            { status: 500 }
        );
    }
}
