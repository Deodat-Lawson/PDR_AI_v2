import { NextResponse } from "next/server";
import { db } from "../../../server/db/index";
import { document, users } from "../../../server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from '@clerk/nextjs/server'


export async function POST(request: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { error: "Invalid user." },
                { status: 400 }
            );
        }

        const results = await db
            .select({
                document: document
            })
            .from(document)
            .innerJoin(users, eq(document.companyId, users.companyId))
            .where(eq(users.userId, userId));

        // Convert BigInt fields to numbers for JSON serialization
        const serializedDocs = results.map(({ document: doc }) => ({
            ...doc,
            id: Number(doc.id),
            companyId: Number(doc.companyId),
        }));

        return NextResponse.json(serializedDocs, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Unable to fetch documents" },
            { status: 500 }
        );
    }
}