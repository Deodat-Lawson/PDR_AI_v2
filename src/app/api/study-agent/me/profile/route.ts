import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentProfile } from "~/server/db/schema";
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

        const [profile] = await db
            .select()
            .from(studyAgentProfile)
            .where(
                and(
                    eq(studyAgentProfile.userId, userId),
                    eq(studyAgentProfile.sessionId, BigInt(session.id))
                )
            );

        return NextResponse.json({ profile: serializeBigInt(profile) ?? null, session: serializeBigInt(session) });
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

        const body = (await request.json()) as {
            sessionId?: number | string;
            name?: string | null;
            grade?: string | null;
            gender?: string | null;
            fieldOfStudy?: string | null;
        };
        const session = await resolveSessionForUser(
            userId,
            typeof body.sessionId === "number"
                ? body.sessionId
                : typeof body.sessionId === "string"
                ? Number(body.sessionId)
                : parseSessionId(request)
        );

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const payload = {
            name: body.name ?? null,
            grade: body.grade ?? null,
            gender: body.gender ?? null,
            fieldOfStudy: body.fieldOfStudy ?? null,
        };

        const [existing] = await db
            .select()
            .from(studyAgentProfile)
            .where(
                and(
                    eq(studyAgentProfile.userId, userId),
                    eq(studyAgentProfile.sessionId, BigInt(session.id))
                )
            );

        if (existing) {
            const [updated] = await db
                .update(studyAgentProfile)
                .set(payload)
                .where(
                    and(
                        eq(studyAgentProfile.userId, userId),
                        eq(studyAgentProfile.sessionId, BigInt(session.id))
                    )
                )
                .returning();

            return NextResponse.json({ profile: serializeBigInt(updated), session: serializeBigInt(session) });
        }

        const [created] = await db
            .insert(studyAgentProfile)
            .values({ ...payload, userId, sessionId: BigInt(session.id) })
            .returning();

        return NextResponse.json({ profile: serializeBigInt(created), session: serializeBigInt(session) }, { status: 201 });
    } catch (error) {
        console.error("Error saving study agent profile", error);
        return NextResponse.json(
            { error: "Failed to save profile" },
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
            .delete(studyAgentProfile)
            .where(
                and(
                    eq(studyAgentProfile.userId, userId),
                    eq(studyAgentProfile.sessionId, BigInt(session.id))
                )
            );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting study agent profile", error);
        return NextResponse.json(
            { error: "Failed to delete profile" },
            { status: 500 }
        );
    }
}
