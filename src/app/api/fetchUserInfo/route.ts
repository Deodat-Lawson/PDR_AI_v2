import { NextResponse } from "next/server";
import { db } from "../../../server/db/index";
import { company, users } from "../../../server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import * as console from "console";
import { auth } from '@clerk/nextjs/server'

export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Invalid user." }, { status: 400 });
        }

        const [result] = await db
            .select({
                user: users,
                company: company,
            })
            .from(users)
            .leftJoin(company, eq(users.companyId, sql`cast(${company.id} as bigint)`))
            .where(eq(users.userId, userId));

        if (!result || !result.user) {
            return NextResponse.json({ error: "Invalid user." }, { status: 400 });
        }

        const { user: userInfo, company: companyRecord } = result;

        if (!companyRecord) {
            return NextResponse.json(
                { error: "Company not found" },
                { status: 404 }
            );
        }

        const submissionDate = new Date(userInfo.createdAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        });

        // Convert BigInt fields to numbers for JSON serialization
        const serializedUserInfo = {
            ...userInfo,
            companyId: Number(userInfo.companyId),
        };

        return NextResponse.json(
            {
                ...serializedUserInfo,
                company: companyRecord.name,
                submissionDate: submissionDate,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Error fetching user and company info:", error);
        return NextResponse.json(
            { error: "Unable to fetch user and company info" },
            { status: 500 }
        );
    }
}
