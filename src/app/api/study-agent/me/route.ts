import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
    studyAgentGoals,
    studyAgentPomodoroSettings,
    studyAgentPreferences,
    studyAgentProfile,
} from "~/server/db/schema";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [profile] = await db
            .select()
            .from(studyAgentProfile)
            .where(eq(studyAgentProfile.userId, userId));

        const [preferences] = await db
            .select()
            .from(studyAgentPreferences)
            .where(eq(studyAgentPreferences.userId, userId));

        const goals = await db
            .select()
            .from(studyAgentGoals)
            .where(eq(studyAgentGoals.userId, userId));

        const [pomodoroSettings] = await db
            .select()
            .from(studyAgentPomodoroSettings)
            .where(eq(studyAgentPomodoroSettings.userId, userId));

        return NextResponse.json({
            profile: profile ?? null,
            preferences: preferences?.preferences ?? null,
            goals: goals.map((goal) => ({ ...goal, id: goal.id.toString() })),
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