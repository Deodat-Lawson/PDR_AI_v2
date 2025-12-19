import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentPomodoroSettings } from "~/server/db/schema";

const DEFAULT_SETTINGS = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
};

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [settings] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(eq(studyAgentPomodoroSettings.userId, userId));

        return NextResponse.json({ settings: settings ?? DEFAULT_SETTINGS });
    } catch (error) {
        console.error("Error fetching Pomodoro settings", error);
        return NextResponse.json(
            { error: "Failed to load Pomodoro settings" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const payload = {
            focusMinutes: body.focusMinutes ?? DEFAULT_SETTINGS.focusMinutes,
            shortBreakMinutes:
                body.shortBreakMinutes ?? DEFAULT_SETTINGS.shortBreakMinutes,
            longBreakMinutes: body.longBreakMinutes ?? DEFAULT_SETTINGS.longBreakMinutes,
            sessionsBeforeLongBreak:
                body.sessionsBeforeLongBreak ?? DEFAULT_SETTINGS.sessionsBeforeLongBreak,
            autoStartBreaks: body.autoStartBreaks ?? DEFAULT_SETTINGS.autoStartBreaks,
            autoStartPomodoros:
                body.autoStartPomodoros ?? DEFAULT_SETTINGS.autoStartPomodoros,
        };

        const [existing] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(eq(studyAgentPomodoroSettings.userId, userId));

        if (existing) {
            const [updated] = await db
                .update(studyAgentPomodoroSettings)
                .set(payload)
                .where(eq(studyAgentPomodoroSettings.userId, userId))
                .returning();

            return NextResponse.json({ settings: updated });
        }

        const [created] = await db
            .insert(studyAgentPomodoroSettings)
            .values({ ...payload, userId })
            .returning();

        return NextResponse.json({ settings: created }, { status: 201 });
    } catch (error) {
        console.error("Error saving Pomodoro settings", error);
        return NextResponse.json(
            { error: "Failed to save Pomodoro settings" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await db
            .delete(studyAgentPomodoroSettings)
            .where(eq(studyAgentPomodoroSettings.userId, userId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error clearing Pomodoro settings", error);
        return NextResponse.json(
            { error: "Failed to delete Pomodoro settings" },
            { status: 500 }
        );
    }
}