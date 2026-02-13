import { createRouteHandler } from "uploadthing/next";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

import { ourFileRouter } from "./core";
import { db } from "~/server/db";
import { users, companyServiceKeys } from "~/server/db/schema";
import { decryptValue } from "~/lib/encryption";
import { env } from "~/env";

/**
 * Helper to fetch the appropriate UploadThing token.
 * 
 * 1. Checks if a companyId is provided in the query params.
 * 2. If so, validates that the current user belongs to that company (security check).
 * 3. Fetches the company's custom UploadThing token if it exists.
 * 4. Falls back to the environment variable if no custom token is found or no companyId provided.
 */
async function getUploadThingToken(): Promise<string | undefined> {
    if (process.env.UPLOADTHING_TOKEN !== undefined) {
        return process.env.UPLOADTHING_TOKEN;
    }
    
    const { userId } = await auth();

    if (userId) {
                const user = await db.query.users.findFirst({
                    where: eq(users.userId, userId),
                    columns: { companyId: true },
                });

                if (user && user.companyId) {
                    // User is authorized for this company. Check for a custom token.
                    const serviceKey = await db.query.companyServiceKeys.findFirst({
                        where: and(
                            eq(companyServiceKeys.companyId, user.companyId),
                            eq(companyServiceKeys.keyType, "uploadthingToken")
                        ),
                        columns: { keyValue: true },
                    });

                    if (serviceKey) {
                        try {
                            const decrypted = decryptValue(serviceKey.keyValue);
                            if (decrypted) {
                                return decrypted;
                            }
                        } catch (e) {
                            console.error("Failed to decrypt UploadThing token for company", user.companyId, e);
                        }
                    }
                }
            
    }

    return undefined;
}

export async function GET(request: NextRequest) {
    const token = await getUploadThingToken();
    
    const { GET: _GET } = createRouteHandler({
        router: ourFileRouter,
        config: {
            token: token,
            isDev: env.server.NODE_ENV === "development",
        },
    });
    
    return _GET(request);
}

export async function POST(request: NextRequest) {
    const token = await getUploadThingToken();
    
    const { POST: _POST } = createRouteHandler({
        router: ourFileRouter,
        config: {
            token: token,
            isDev: env.server.NODE_ENV === "development",
        },
    });
    
    return _POST(request);
}
