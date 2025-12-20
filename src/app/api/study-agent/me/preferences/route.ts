import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentPreferences } from "~/server/db/schema";
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

        const [preferences] = await db
            .select()
            .from(studyAgentPreferences)
            .where(
                and(
                    eq(studyAgentPreferences.userId, userId),
                    eq(studyAgentPreferences.sessionId, session.id)
                )
            );

        return NextResponse.json({ preferences: preferences?.preferences ?? null, session: serializeBigInt(session) });
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

        const body = await request.json();
        const session = await resolveSessionForUser(
            userId,
            body.sessionId ?? parseSessionId(request)
        );

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const preferences = body.preferences ?? {};

        const [existing] = await db
            .select()
            .from(studyAgentPreferences)
            .where(
                and(
                    eq(studyAgentPreferences.userId, userId),
                    eq(studyAgentPreferences.sessionId, session.id)
                )
            );

        if (existing) {
            const [updated] = await db
                .update(studyAgentPreferences)
                .set({ preferences })
                .where(
                    and(
                        eq(studyAgentPreferences.userId, userId),
                        eq(studyAgentPreferences.sessionId, session.id)
                    )
                )
                .returning();

            return NextResponse.json({ preferences: updated.preferences, session: serializeBigInt(session) });
        }

        const [created] = await db
            .insert(studyAgentPreferences)
            .values({ userId, sessionId: session.id, preferences })
            .returning();

        return NextResponse.json({ preferences: created.preferences, session: serializeBigInt(session) }, { status: 201 });
    } catch (error) {
        console.error("Error saving study agent preferences", error);
        return NextResponse.json(
            { error: "Failed to save preferences" },
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
            .delete(studyAgentPreferences)
            .where(
                and(
                    eq(studyAgentPreferences.userId, userId),
                    eq(studyAgentPreferences.sessionId, session.id)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting study agent preferences", error);
        return NextResponse.json(
            { error: "Failed to delete preferences" },
            { status: 500 }
        );
    }
}
