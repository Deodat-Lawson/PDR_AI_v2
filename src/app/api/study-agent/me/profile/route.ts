import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentProfile } from "~/server/db/schema";

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

        return NextResponse.json({ profile: profile ?? null });
    } catch (error) {
        console.error("Error fetching study agent profile", error);
        return NextResponse.json(
            { error: "Failed to load profile" },
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
        const payload = {
            name: body.name ?? null,
            grade: body.grade ?? null,
            gender: body.gender ?? null,
            fieldOfStudy: body.fieldOfStudy ?? null,
        };

        const [existing] = await db
            .select()
            .from(studyAgentProfile)
            .where(eq(studyAgentProfile.userId, userId));

        if (existing) {
            const [updated] = await db
                .update(studyAgentProfile)
                .set(payload)
                .where(eq(studyAgentProfile.userId, userId))
                .returning();

            return NextResponse.json({ profile: updated });
        }

        const [created] = await db
            .insert(studyAgentProfile)
            .values({ ...payload, userId })
            .returning();

        return NextResponse.json({ profile: created }, { status: 201 });
    } catch (error) {
        console.error("Error saving study agent profile", error);
        return NextResponse.json(
            { error: "Failed to save profile" },
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

        await db.delete(studyAgentProfile).where(eq(studyAgentProfile.userId, userId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting study agent profile", error);
        return NextResponse.json(
            { error: "Failed to delete profile" },
            { status: 500 }
        );
    }
}