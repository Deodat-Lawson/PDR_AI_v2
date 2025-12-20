import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "~/server/db";
import { studyAgentSessions } from "~/server/db/schema";

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

        return NextResponse.json({ session });
    } catch (error) {
        console.error("Error creating study agent session", error);
        return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
        );
    }
}
