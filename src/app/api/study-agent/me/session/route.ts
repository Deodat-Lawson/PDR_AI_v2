import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "~/server/db";
import { studyAgentSessions } from "~/server/db/schema";

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

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const name = typeof body?.name === "string" && body.name.trim().length > 0
            ? body.name.trim()
            : undefined;

        const [session] = await db
            .insert(studyAgentSessions)
            .values({ userId, name })
            .returning();

        return NextResponse.json({ session: serializeBigInt(session) });
    } catch (error) {
        console.error("Error creating study agent session", error);
        return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
        );
    }
}
