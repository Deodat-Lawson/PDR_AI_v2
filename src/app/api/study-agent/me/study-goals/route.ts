import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentGoals } from "~/server/db/schema";
import { resolveSessionForUser } from "~/server/study-agent/session";

function mapGoal(goal: typeof studyAgentGoals.$inferSelect) {
    return {
        ...goal,
        id: goal.id.toString(),
    };
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

        const goals = await db
            .select()
            .from(studyAgentGoals)
            .where(
                and(
                    eq(studyAgentGoals.userId, userId),
                    eq(studyAgentGoals.sessionId, session.id)
                )
            );

        return NextResponse.json({ goals: goals.map(mapGoal), session });
    } catch (error) {
        console.error("Error fetching study goals", error);
        return NextResponse.json({ error: "Failed to load study goals" }, { status: 500 });
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

        // Bulk replace goals if items array provided
        if (Array.isArray(body.items)) {
            await db
                .delete(studyAgentGoals)
                .where(
                    and(
                        eq(studyAgentGoals.userId, userId),
                        eq(studyAgentGoals.sessionId, session.id)
                    )
                );

            const inserted = await db
                .insert(studyAgentGoals)
                .values(
                    body.items.map((item: any) => ({
                        userId,
                        sessionId: session.id,
                        title: item.title ?? "",
                        description: item.description ?? null,
                        materials: item.materials ?? [],
                        completed: Boolean(item.completed),
                    }))
                )
                .returning();

            return NextResponse.json({ goals: inserted.map(mapGoal), session }, { status: 201 });
        }

        const [created] = await db
            .insert(studyAgentGoals)
            .values({
                userId,
                sessionId: session.id,
                title: body.title ?? "",
                description: body.description ?? null,
                materials: body.materials ?? [],
                completed: Boolean(body.completed),
            })
            .returning();

        return NextResponse.json({ goal: mapGoal(created), session }, { status: 201 });
    } catch (error) {
        console.error("Error saving study goals", error);
        return NextResponse.json({ error: "Failed to save study goals" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
        }

        const session = await resolveSessionForUser(
            userId,
            body.sessionId ?? parseSessionId(request)
        );

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const [updated] = await db
            .update(studyAgentGoals)
            .set({
                title: body.title,
                description: body.description,
                materials: body.materials,
                completed: body.completed,
            })
            .where(
                and(
                    eq(studyAgentGoals.id, Number(body.id)),
                    eq(studyAgentGoals.userId, userId),
                    eq(studyAgentGoals.sessionId, session.id)
                )
            )
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        return NextResponse.json({ goal: mapGoal(updated), session });
    } catch (error) {
        console.error("Error updating study goal", error);
        return NextResponse.json({ error: "Failed to update study goal" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
        }

        const session = await resolveSessionForUser(
            userId,
            body.sessionId ?? parseSessionId(request)
        );

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        await db
            .delete(studyAgentGoals)
            .where(
                and(
                    eq(studyAgentGoals.id, Number(body.id)),
                    eq(studyAgentGoals.userId, userId),
                    eq(studyAgentGoals.sessionId, session.id)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting study goal", error);
        return NextResponse.json({ error: "Failed to delete study goal" }, { status: 500 });
    }
}
