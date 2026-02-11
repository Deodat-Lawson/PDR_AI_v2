import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import { db } from "~/server/db/index";
import { users, companyServiceKeys } from "~/server/db/schema";
import { encryptValue, decryptValue, maskValue } from "~/lib/encryption";
import { validateRequestBody, ServiceConnectionsSchema } from "~/lib/validation";

const AUTHORIZED_ROLES = new Set(["employer", "owner"]);

// ============================================================================
// GET — Fetch masked connection status for the employer's company
// ============================================================================

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const [userRecord] = await db
      .select({ companyId: users.companyId, role: users.role })
      .from(users)
      .where(eq(users.userId, userId));

    if (!userRecord || !AUTHORIZED_ROLES.has(userRecord.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const rows = await db
      .select({
        keyType: companyServiceKeys.keyType,
        keyValue: companyServiceKeys.keyValue,
      })
      .from(companyServiceKeys)
      .where(eq(companyServiceKeys.companyId, BigInt(userRecord.companyId)));

    // Build a response map: { keyType: { isConnected, maskedKey } }
    const services: Record<
      string,
      { isConnected: boolean; maskedKey: string | null }
    > = {};

    for (const row of rows) {
      try {
        const plain = decryptValue(row.keyValue);
        services[row.keyType] = {
          isConnected: true,
          maskedKey: maskValue(plain),
        };
      } catch {
        // If decryption fails (e.g. key rotated), treat as disconnected
        services[row.keyType] = { isConnected: false, maskedKey: null };
      }
    }

    return NextResponse.json({ success: true, services }, { status: 200 });
  } catch (error) {
    console.error("Error fetching service connections:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch service connections." },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST — Save / update service keys for the employer's company
// ============================================================================

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const [userRecord] = await db
      .select({ companyId: users.companyId, role: users.role })
      .from(users)
      .where(eq(users.userId, userId));

    if (!userRecord || !AUTHORIZED_ROLES.has(userRecord.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const validation = await validateRequestBody(
      request,
      ServiceConnectionsSchema
    );
    if (!validation.success) {
      return validation.response;
    }

    const { keys } = validation.data;
    const companyId = BigInt(userRecord.companyId);

    // Upsert each key using ON CONFLICT
    for (const entry of keys) {
      const trimmed = entry.keyValue.trim();

      if (trimmed.length === 0) {
        // If value is empty, delete the row if it exists
        await db
          .delete(companyServiceKeys)
          .where(
            and(
              eq(companyServiceKeys.companyId, companyId),
              eq(companyServiceKeys.keyType, entry.keyType)
            )
          );
      } else {
        const encrypted = encryptValue(trimmed);

        await db
          .insert(companyServiceKeys)
          .values({
            companyId,
            keyType: entry.keyType,
            keyValue: encrypted,
          })
          .onConflictDoUpdate({
            target: [companyServiceKeys.companyId, companyServiceKeys.keyType],
            set: {
              keyValue: encrypted,
              updatedAt: sql`now()`,
            },
          });
      }
    }

    return NextResponse.json(
      { success: true, message: "Service connections updated." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating service connections:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update service connections." },
      { status: 500 }
    );
  }
}
