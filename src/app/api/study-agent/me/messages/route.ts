import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { studyAgentMessages } from "~/server/db/schema";
import { resolveSessionForUser } from "~/server/study-agent/session";
import { asc } from "drizzle-orm";

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

        const sessionIdBigInt = BigInt(session.id);

        // Handle batch insert for multiple messages
        if (Array.isArray(body.messages)) {
            const toInsert = body.messages.map((msg: {
                originalId?: string;
                role: string;
                content: string;
                ttsContent?: string;
                attachedDocument?: string;
                attachedDocumentId?: string;
                attachedDocumentUrl?: string;
                isVoice?: boolean;
                createdAt?: string;
            }) => ({
                odlId: msg.originalId ?? null,
                userId,
                sessionId: sessionIdBigInt,
                role: msg.role,
                content: msg.content,
                ttsContent: msg.ttsContent ?? null,
                attachedDocument: msg.attachedDocument ?? null,
                attachedDocumentId: msg.attachedDocumentId ?? null,
                attachedDocumentUrl: msg.attachedDocumentUrl ?? null,
                isVoice: Boolean(msg.isVoice),
                createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            }));

            const inserted = await db
                .insert(studyAgentMessages)
                .values(toInsert)
                .returning();

            return NextResponse.json({
                messages: inserted.map((msg) => serializeBigInt({ ...msg, id: msg.id.toString() })),
            }, { status: 201 });
        }

        // Single message insert
        const [created] = await db
            .insert(studyAgentMessages)
            .values({
                odlId: body.originalId ?? null,
                userId,
                sessionId: sessionIdBigInt,
                role: body.role,
                content: body.content,
                ttsContent: body.ttsContent ?? null,
                attachedDocument: body.attachedDocument ?? null,
                attachedDocumentId: body.attachedDocumentId ?? null,
                attachedDocumentUrl: body.attachedDocumentUrl ?? null,
                isVoice: Boolean(body.isVoice),
                createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
            })
            .returning();

        if (!created) {
            return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
        }

        return NextResponse.json({
            message: serializeBigInt({ ...created, id: created.id.toString() }),
        }, { status: 201 });
    } catch (error) {
        console.error("Error saving message", error);
        return NextResponse.json(
            { error: "Failed to save message" },
            { status: 500 }
        );
    }
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

        const messages = await db
            .select()
            .from(studyAgentMessages)
            .where(
                and(
                    eq(studyAgentMessages.userId, userId),
                    eq(studyAgentMessages.sessionId, BigInt(session.id))
                )
            )
            .orderBy(asc(studyAgentMessages.createdAt), asc(studyAgentMessages.id));

        return NextResponse.json({
            messages: messages.map((msg) =>
                serializeBigInt({ ...msg, id: msg.id.toString() })
            ),
            session: serializeBigInt(session),
        });
    } catch (error) {
        console.error("Error loading messages", error);
        return NextResponse.json(
            { error: "Failed to load messages" },
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

        // Delete all messages for this session
        await db
            .delete(studyAgentMessages)
            .where(
                and(
                    eq(studyAgentMessages.userId, userId),
                    eq(studyAgentMessages.sessionId, BigInt(session.id))
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting messages", error);
        return NextResponse.json(
            { error: "Failed to delete messages" },
            { status: 500 }
        );
    }
}

