import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentPreferences } from "~/server/db/schema";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [preferences] = await db
            .select()
            .from(studyAgentPreferences)
            .where(eq(studyAgentPreferences.userId, userId));

        return NextResponse.json({ preferences: preferences?.preferences ?? null });
    } catch (error) {
        console.error("Error fetching study agent preferences", error);
        return NextResponse.json(
            { error: "Failed to load preferences" },
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

        const preferences = await request.json();

        const [existing] = await db
            .select()
            .from(studyAgentPreferences)
            .where(eq(studyAgentPreferences.userId, userId));

        if (existing) {
            const [updated] = await db
                .update(studyAgentPreferences)
                .set({ preferences })
                .where(eq(studyAgentPreferences.userId, userId))
                .returning();

            return NextResponse.json({ preferences: updated.preferences });
        }

        const [created] = await db
            .insert(studyAgentPreferences)
            .values({ userId, preferences })
            .returning();

        return NextResponse.json({ preferences: created.preferences }, { status: 201 });
    } catch (error) {
        console.error("Error saving study agent preferences", error);
        return NextResponse.json(
            { error: "Failed to save preferences" },
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
            .delete(studyAgentPreferences)
            .where(eq(studyAgentPreferences.userId, userId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting study agent preferences", error);
        return NextResponse.json(
            { error: "Failed to delete preferences" },
            { status: 500 }
        );
    }
}